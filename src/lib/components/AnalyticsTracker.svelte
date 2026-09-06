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
			if (navigator.sendBeacon && (eventType === 'duration' || eventType === 'scroll')) {
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
		send('pageview');
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

	function onClick(e) {
		const target = e.target.closest?.('a, button');
		if (!target) return;
		const label = (target.textContent || target.getAttribute('aria-label') || target.href || '')
			.trim()
			.replace(/\s+/g, ' ')
			.slice(0, 120);
		send('click', { label });
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

		window.addEventListener('scroll', onScroll, { passive: true });
		document.addEventListener('click', onClick, true);
		window.addEventListener('error', onWindowError);
		window.addEventListener('unhandledrejection', onUnhandledRejection);
		window.addEventListener('pagehide', sendDuration);
		document.addEventListener('visibilitychange', onVisibilityChange);

		return () => {
			window.removeEventListener('scroll', onScroll);
			document.removeEventListener('click', onClick, true);
			window.removeEventListener('error', onWindowError);
			window.removeEventListener('unhandledrejection', onUnhandledRejection);
			window.removeEventListener('pagehide', sendDuration);
			document.removeEventListener('visibilitychange', onVisibilityChange);
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
