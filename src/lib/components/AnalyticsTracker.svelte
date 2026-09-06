<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { afterNavigate } from '$app/navigation';

	/**
	 * Self-hosted visitor analytics, mounted once in the public route
	 * group's layout (never on /admin — tracking the admin's own dashboard
	 * visits isn't useful "visitor" data). Everything here is best-effort:
	 * a failure must never break the actual page, so every send is wrapped
	 * and errors are swallowed.
	 *
	 * Session id lives in localStorage (not a real cookie) — good enough
	 * to group one browser's events together and tell new vs. returning
	 * apart; it's the "cookie/session identifier" the analytics table
	 * doubles as.
	 */

	let sessionId = '';
	let isNewSession = false;
	let pageEnteredAt = 0;
	let currentPath = '';
	let maxScrollPercent = 0;
	let scrollMilestonesSent = new Set();

	function getSessionId() {
		try {
			let id = localStorage.getItem('_an_sid');
			if (!id) {
				id = crypto.randomUUID();
				localStorage.setItem('_an_sid', id);
				isNewSession = true;
			}
			return id;
		} catch {
			// Storage blocked (private mode, etc.) — fall back to a
			// per-pageload id; every pageview just looks "new".
			isNewSession = true;
			return crypto.randomUUID();
		}
	}

	function send(eventType, extra = {}) {
		if (!sessionId) return;
		try {
			const params = $page.url.searchParams;
			const payload = {
				session_id: sessionId,
				is_new_session: isNewSession,
				event_type: eventType,
				path: $page.url.pathname,
				referrer: document.referrer || null,
				utm_source: params.get('utm_source'),
				utm_medium: params.get('utm_medium'),
				utm_campaign: params.get('utm_campaign'),
				screen_width: window.screen?.width,
				screen_height: window.screen?.height,
				language: navigator.language,
				timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
				...extra
			};
			const body = JSON.stringify(payload);
			// sendBeacon survives the page actually unloading, which a normal
			// fetch does not reliably do — used for the "on the way out"
			// events (duration/final scroll depth).
			if (navigator.sendBeacon && (eventType === 'duration' || eventType === 'scroll' || eventType === 'web_vital')) {
				navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }));
			} else {
				fetch('/api/track', {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body,
					keepalive: true
				}).catch(() => {});
			}
		} catch {
			// Analytics must never break the page.
		}
	}

	function trackPageview() {
		currentPath = $page.url.pathname;
		pageEnteredAt = performance.now();
		maxScrollPercent = 0;
		scrollMilestonesSent = new Set();
		// A 404 (or any error boundary) isn't real content — flagged as its
		// own event type instead of inflating "top pages", so broken/dead
		// links pointing at this site show up distinctly on the dashboard.
		if ($page.status && $page.status >= 400) {
			send('not_found', { label: `${$page.status} ${$page.error?.message ?? ''}`.trim() });
		} else {
			send('pageview');
		}
	}

	function sendDuration() {
		if (!pageEnteredAt) return;
		const seconds = Math.round((performance.now() - pageEnteredAt) / 1000);
		if (seconds < 1) return;
		send('duration', { path: currentPath, duration_seconds: seconds, scroll_percent: maxScrollPercent });
		pageEnteredAt = 0;
	}

	function onScroll() {
		const doc = document.documentElement;
		const scrollable = doc.scrollHeight - doc.clientHeight;
		if (scrollable <= 0) return;
		const percent = Math.min(100, Math.round((window.scrollY / scrollable) * 100));
		if (percent > maxScrollPercent) maxScrollPercent = percent;
		for (const milestone of [25, 50, 90]) {
			if (percent >= milestone && !scrollMilestonesSent.has(milestone)) {
				scrollMilestonesSent.add(milestone);
				send('scroll', { scroll_percent: milestone });
			}
		}
	}

	// Href patterns that mark a click as a real business "goal" for a
	// portfolio site (did anyone actually download the CV, message on
	// WhatsApp, open a live project, or email?) rather than just noise —
	// shown as its own section on the dashboard instead of buried in the
	// generic click list.
	function detectGoal(target) {
		const href = target.href || '';
		if (/[?&]download=CV\.pdf/i.test(href)) return 'cv_download';
		if (/[?&]download=Resume\.pdf/i.test(href)) return 'resume_download';
		if (/wa\.me|api\.whatsapp\.com/i.test(href)) return 'whatsapp_click';
		if (/^mailto:/i.test(href)) return 'email_click';
		if (target.classList?.contains('cta-button')) return 'live_project_click';
		return null;
	}

	function onClick(e) {
		// The interactive ancestor (a/button) is what functionally matters
		// for navigation/goal purposes — but the click may have actually
		// landed ON an <img> nested inside one (e.g. a project thumbnail
		// wrapped in a link), or on a bare <img> with no link/button at all
		// (nothing "happens", but it's still a real signal someone was
		// interested in that image). Both cases get recorded; a bare image
		// just has no `goal` and its own element_type.
		const interactiveEl = e.target.closest?.('a, button');
		const imgEl = e.target.closest?.('img');
		const target = interactiveEl || imgEl;
		if (!target) return;

		const elementType = interactiveEl ? (interactiveEl.tagName === 'A' ? 'link' : 'button') : 'image';

		let label = '';
		if (imgEl && imgEl !== interactiveEl) {
			label = imgEl.getAttribute('alt') || imgEl.currentSrc || imgEl.src || '';
		}
		if (!label) {
			label = target.textContent || target.getAttribute('aria-label') || target.href || '';
		}
		label = label.trim().replace(/\s+/g, ' ').slice(0, 120);

		const goal = interactiveEl ? detectGoal(interactiveEl) : null;
		send('click', { label, metadata: goal ? { element_type: elementType, goal } : { element_type: elementType } });
	}

	// Lets other components report a real conversion that a click alone
	// can't confirm (e.g. the message form actually succeeding, not just
	// the submit button being pressed) without importing this module
	// directly — see ContactFooter.svelte's message-sent handler.
	function onGoalEvent(e) {
		const { goal, label } = e.detail ?? {};
		if (!goal) return;
		send('click', { label: label ?? goal, metadata: { goal } });
	}

	// Core Web Vitals — LCP and CLS, hand-rolled via the native
	// PerformanceObserver (no web-vitals dependency). Both are real Google
	// ranking factors, so this ties directly back to the site's SEO goal,
	// not just "more data for its own sake". INP (the third Core Web
	// Vital) is deliberately skipped — accurately attributing it needs
	// more plumbing than a quick native observer reasonably gives you;
	// said so here rather than reporting a shaky number as if it were
	// solid.
	function trackWebVitals() {
		try {
			let lcp = null;
			new PerformanceObserver((list) => {
				const entries = list.getEntries();
				const last = entries[entries.length - 1];
				if (last) lcp = Math.round(last.startTime);
			}).observe({ type: 'largest-contentful-paint', buffered: true });

			let cls = 0;
			new PerformanceObserver((list) => {
				for (const entry of list.getEntries()) {
					if (!entry.hadRecentInput) cls += entry.value;
				}
			}).observe({ type: 'layout-shift', buffered: true });

			const report = () => {
				if (lcp != null) send('web_vital', { label: 'LCP', metadata: { metric: 'LCP', value_ms: lcp } });
				send('web_vital', { label: 'CLS', metadata: { metric: 'CLS', value: Math.round(cls * 1000) / 1000 } });
			};
			// LCP/CLS both keep updating until the page is hidden/unloaded —
			// report the final values then, same moment as duration.
			window.addEventListener('pagehide', report, { once: true });
			document.addEventListener(
				'visibilitychange',
				() => {
					if (document.visibilityState === 'hidden') report();
				},
				{ once: true }
			);
		} catch {
			// PerformanceObserver or these entry types aren't supported —
			// just skip Core Web Vitals for this visitor, no big deal.
		}
	}

	function onWindowError(e) {
		send('error', { label: String(e?.message ?? 'Unknown error').slice(0, 300) });
	}
	function onUnhandledRejection(e) {
		send('error', { label: String(e?.reason?.message ?? e?.reason ?? 'Unhandled rejection').slice(0, 300) });
	}
	function onVisibilityChange() {
		if (document.visibilityState === 'hidden') sendDuration();
	}

	onMount(() => {
		sessionId = getSessionId();
		trackPageview();
		trackWebVitals();

		window.addEventListener('scroll', onScroll, { passive: true });
		document.addEventListener('click', onClick, true);
		window.addEventListener('error', onWindowError);
		window.addEventListener('unhandledrejection', onUnhandledRejection);
		window.addEventListener('pagehide', sendDuration);
		document.addEventListener('visibilitychange', onVisibilityChange);
		window.addEventListener('analytics:goal', onGoalEvent);

		return () => {
			window.removeEventListener('scroll', onScroll);
			document.removeEventListener('click', onClick, true);
			window.removeEventListener('error', onWindowError);
			window.removeEventListener('unhandledrejection', onUnhandledRejection);
			window.removeEventListener('pagehide', sendDuration);
			document.removeEventListener('visibilitychange', onVisibilityChange);
			window.removeEventListener('analytics:goal', onGoalEvent);
		};
	});

	// Fires once on initial mount AND after every subsequent client-side
	// navigation — the initial-mount case is a no-op here since onMount's
	// trackPageview() already ran for it (guarded by the path check).
	afterNavigate(({ from, to }) => {
		if (!sessionId) return;
		if (from && to && from.url.pathname !== to.url.pathname) {
			sendDuration();
			trackPageview();
		}
	});
</script>
