/**
 * Builds a <script type="application/ld+json"> tag for {@html} in a
 * <svelte:head> block. Two things aren't obvious from a plain template
 * string:
 * 1) JSON.stringify does not escape closing-tag-like sequences, so a
 *    description containing one verbatim would break out of the tag —
 *    escaping every angle bracket as a unicode sequence (still valid
 *    JSON, decodes back to the same string) closes that off.
 * 2) the opening/closing tag names are built via concat, not written out
 *    whole, because a literal occurrence elsewhere in a file previously
 *    confused the Svelte compiler's own tag scanning.
 */
export function jsonLdScriptTag(obj) {
	const json = JSON.stringify(obj).replace(/</g, '\\u003c');
	const open = '<' + 'script type="application/ld+json">';
	const close = '<' + '/script>';
	return open + json + close;
}
