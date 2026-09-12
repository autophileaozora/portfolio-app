/**
 * Reusable Svelte action: reveals an element with a fade + small
 * translateY, either the first time it scrolls into view
 * (IntersectionObserver, disconnected after firing once — never
 * re-hides/re-plays on scroll back up) or immediately on mount (for
 * above-the-fold content like the hero, where a staggered entrance delay
 * matters more than viewport detection).
 *
 * Respects prefers-reduced-motion: reduce by skipping straight to the
 * final visible state — the element's presence/content never depends on
 * the animation running.
 *
 * Usage:
 *   <div use:reveal>                              scroll-triggered
 *   <div use:reveal={{ delay: 160 }}>              scroll-triggered, delayed
 *   <div use:reveal={{ immediate: true, delay: 80 }}>  plays right away (hero)
 *
 * Options:
 *   delay      ms before the transition starts (default 0)
 *   duration   ms the fade/translate takes (default 600)
 *   y          px the element starts offset by, default 24 (immediate
 *              mode) or 20 (scroll mode) — kept small per the "subtle"
 *              intensity this site's scroll reveals should have
 *   immediate  true = play on mount instead of waiting to scroll into view
 *   threshold  IntersectionObserver threshold (default 0.15)
 */
export function reveal(node, options = {}) {
	let observer;
	let reduceMotionQuery;
	let onReduceMotionChange;

	function getReduceMotion() {
		return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
	}

	function run(opts) {
		const { delay = 0, duration = 600, immediate = false, threshold = 0.15 } = opts ?? {};
		const y = opts?.y ?? (immediate ? 24 : 20);

		if (getReduceMotion()) {
			node.style.opacity = '1';
			node.style.transform = 'none';
			return;
		}

		node.style.opacity = '0';
		node.style.transform = `translateY(${y}px)`;
		node.style.transitionProperty = 'opacity, transform';
		node.style.transitionDuration = `${duration}ms`;
		node.style.transitionTimingFunction = 'cubic-bezier(0.22, 1, 0.36, 1)';
		node.style.transitionDelay = `${delay}ms`;

		function show() {
			node.style.opacity = '1';
			node.style.transform = 'translateY(0)';
		}

		if (immediate) {
			// Two rAFs so the browser paints the hidden state at least once
			// before starting the transition — without this the transition
			// can get skipped entirely on some browsers when the "from" and
			// "to" styles are both applied in the same frame.
			requestAnimationFrame(() => requestAnimationFrame(show));
			return;
		}

		observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						show();
						observer.disconnect();
					}
				}
			},
			{ threshold }
		);
		observer.observe(node);
	}

	run(options);

	// If the user toggles their OS-level reduced-motion setting while this
	// element is still mid-animation (rare, but cheap to handle), snap it
	// to the final state instead of leaving it stuck faded out.
	if (typeof window !== 'undefined' && window.matchMedia) {
		reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
		onReduceMotionChange = (e) => {
			if (e.matches) {
				node.style.transitionDuration = '0ms';
				node.style.opacity = '1';
				node.style.transform = 'none';
			}
		};
		reduceMotionQuery.addEventListener?.('change', onReduceMotionChange);
	}

	return {
		destroy() {
			observer?.disconnect();
			reduceMotionQuery?.removeEventListener?.('change', onReduceMotionChange);
		}
	};
}
