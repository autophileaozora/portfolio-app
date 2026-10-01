/**
 * Reports whether a -webkit-line-clamp'd element is actually clipping its
 * text right now (scrollHeight exceeds its clamped clientHeight) — used to
 * only make a card clickable/show a "read more" affordance when its text
 * genuinely got cut off, not on every card regardless of length.
 *
 * A ResizeObserver (not a one-off check or a plain window resize listener)
 * re-measures whenever the element's own box size changes — covers both an
 * actual window resize AND a responsive breakpoint changing font-size
 * (project-detail.css shrinks .card p's font at narrower widths), either of
 * which can flip whether the same text clips at the same 10-line clamp.
 *
 * Usage: <p use:detectClamp={(isClamped) => ...}>{longText}</p>
 */
export function detectClamp(node, callback) {
	let cb = callback;

	function check() {
		// +1px tolerance for subpixel layout rounding, which can otherwise
		// register as "clamped" by a fraction of a pixel on text that isn't
		// actually cut off.
		cb(node.scrollHeight > node.clientHeight + 1);
	}

	check();
	const observer = new ResizeObserver(check);
	observer.observe(node);

	return {
		update(newCallback) {
			cb = newCallback;
			check();
		},
		destroy() {
			observer.disconnect();
		}
	};
}
