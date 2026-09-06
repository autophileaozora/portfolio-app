/**
 * Generic heading-based document → blocks engine, shared by every
 * doc-import parser (Projects, Experience, Skills, Testimonials, Stats,
 * Profile). Deterministic, no AI — see parseProjectDoc.ts for the original
 * write-up of the two source shapes this handles:
 *
 * - .docx (via mammoth's HTML, which maps Word's built-in "Heading 1/2/3"
 *   styles to <h1>/<h2>/<h3>) — real heading levels survive extraction.
 * - .pdf (via pdfjs-dist's flat text) — no heading semantics survive
 *   extraction, so a line only counts as a heading if it STARTS with one
 *   of the caller's known labels as a whole word.
 *
 * Extracted out of parseProjectDoc.ts so the other resources' importers
 * (parseSimpleDoc.ts) can reuse the same block-splitting/placeholder
 * logic instead of re-implementing it per resource.
 */

export interface Block {
	level: 1 | 2 | 3;
	/** Lowercased, for matching against known heading labels. */
	heading: string;
	/** Original case — used as display text (e.g. a documentation slide's
	 *  title) where lowercasing would be a display regression. */
	headingRaw: string;
	paragraphs: string[];
}

/** Common "not filled in" placeholders (these templates get written by
 *  hand, and admins reasonably write "belum dicantumkan" etc. instead of
 *  just leaving a field's line blank) — treated as empty, not as a real
 *  value. */
export const PLACEHOLDER_VALUES = new Set([
	'belum dicantumkan',
	'belum ada',
	'tidak ada',
	'-',
	'n/a',
	'tba',
	'tbd',
	'kosong'
]);
export function isPlaceholder(val: string) {
	return PLACEHOLDER_VALUES.has(val.trim().toLowerCase());
}

function decodeEntities(s: string) {
	return s
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'");
}

function stripTags(html: string) {
	return decodeEntities(html.replace(/<[^>]+>/g, ' '))
		.replace(/\s+/g, ' ')
		.trim();
}

/** Walks mammoth's HTML output in document order, splitting on h1/h2/h3. */
export function docxToBlocks(html: string): Block[] {
	const blocks: Block[] = [];
	const re = /<(h1|h2|h3|p|ul|ol)>([\s\S]*?)<\/\1>/g;
	let m: RegExpExecArray | null;
	while ((m = re.exec(html))) {
		const tag = m[1];
		const inner = m[2];
		if (tag === 'h1' || tag === 'h2' || tag === 'h3') {
			const level = Number(tag[1]) as 1 | 2 | 3;
			const headingRaw = stripTags(inner);
			blocks.push({ level, heading: headingRaw.toLowerCase(), headingRaw, paragraphs: [] });
		} else if (tag === 'p') {
			const text = stripTags(inner);
			if (text && blocks.length) blocks[blocks.length - 1].paragraphs.push(text);
		} else if ((tag === 'ul' || tag === 'ol') && blocks.length) {
			const liRe = /<li>([\s\S]*?)<\/li>/g;
			let lm: RegExpExecArray | null;
			const lines: string[] = [];
			while ((lm = liRe.exec(inner))) {
				const t = stripTags(lm[1]);
				if (t) lines.push(t);
			}
			if (lines.length) blocks[blocks.length - 1].paragraphs.push(lines.join('\n'));
		}
	}
	return blocks;
}

/**
 * A line counts as a heading if it STARTS with one of `knownLabels` (as a
 * whole word — followed by a colon, whitespace, or nothing else on the
 * line) — not only if the label is alone on its own line. In practice,
 * most hand-written PDFs put the label and its value on the SAME line
 * ("Jabatan Frontend Developer") rather than the label alone followed by
 * the value on the next line.
 */
export function matchPdfHeading(line: string, sortedLabels: string[]): { label: string; rest: string } | null {
	const lower = line.toLowerCase();
	for (const label of sortedLabels) {
		if (lower === label) return { label, rest: '' };
		if (lower.startsWith(label + ':')) return { label, rest: line.slice(label.length + 1).trim() };
		if (lower.startsWith(label + ' ')) return { label, rest: line.slice(label.length).trim() };
	}
	return null;
}

/**
 * @param knownLabels the full set of recognized heading labels (lowercase),
 *   used to detect where a "heading line" starts in flat PDF text. Longest
 *   labels are tried first so e.g. "tanggal selesai" matches before a
 *   shorter overlapping label would.
 * @param titleLabel a label (e.g. 'judul') that should be treated as
 *   level 1 (title) rather than level 2 — everything else parses as
 *   level 2. Omit if the caller's schema has no title-like field.
 */
export function pdfToBlocks(text: string, knownLabels: string[], titleLabel?: string): Block[] {
	const sorted = [...knownLabels].sort((a, b) => b.length - a.length);
	const blocks: Block[] = [];
	for (const raw of text.split(/\r?\n/)) {
		const line = raw.trim().replace(/^#+\s*/, '');
		if (!line) continue;
		const match = matchPdfHeading(line, sorted);
		if (match) {
			blocks.push({
				level: titleLabel && match.label === titleLabel ? 1 : 2,
				heading: match.label,
				headingRaw: line.slice(0, match.label.length),
				paragraphs: []
			});
			if (match.rest) blocks[blocks.length - 1].paragraphs.push(match.rest);
		} else if (blocks.length) {
			blocks[blocks.length - 1].paragraphs.push(line);
		}
	}
	return blocks;
}

export function linesOf(paragraphs: string[]) {
	return paragraphs
		.flatMap((p) => p.split('\n'))
		.map((l) => l.trim())
		.filter(Boolean);
}

/** Plain text with all tags stripped — used by the Skills bulk importer,
 *  which doesn't care about headings at all, just a flat list of names. */
export function docxHtmlToPlainText(html: string) {
	return stripTags(html.replace(/<(p|li|h1|h2|h3)>/g, '\n<$1>'));
}
