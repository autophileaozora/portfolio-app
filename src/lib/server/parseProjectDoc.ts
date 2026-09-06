/**
 * Deterministic (no AI) extraction of project-wizard fields from a
 * heading-based document template. Two source shapes feed the same
 * assembler:
 *
 * - .docx (via mammoth's HTML, which maps Word's built-in "Heading 1/2/3"
 *   styles to <h1>/<h2>/<h3>) — real heading levels are available, so
 *   "Dokumentasi" can have per-slide <h3> sub-headings underneath it.
 * - .pdf (via pdf-parse's flat text) — no heading semantics survive
 *   extraction, so a line is only recognized as a heading if it exactly
 *   matches one of the known labels; "Dokumentasi" can't be split into
 *   multiple slides this way, so the whole block becomes one slide.
 *
 * Anything not matching a known heading is reported back as a warning
 * rather than silently dropped, so the admin knows what to fill in by
 * hand afterward.
 */

export type SectionType = 'problem' | 'solution' | 'result' | 'documentation';

export interface ParsedProjectFields {
	title: string;
	short_description: string;
	category: string;
	role: string;
	contributors: { name: string; url: string }[];
	associated_with: string;
	date_start: string;
	date_end: string;
	live_url: string;
	tags: string[];
	meta_title: string;
	meta_description: string;
	sections: { type: SectionType; title: string; content: string }[];
}

interface Block {
	level: 1 | 2 | 3;
	/** Lowercased, for matching against the known heading labels. */
	heading: string;
	/** Original case — h3 (documentation slide) headings use this as the
	 *  slide's actual title, since forcing "Halaman Beranda" to lowercase
	 *  would be a display regression, not just a matching convenience. */
	headingRaw: string;
	paragraphs: string[];
}

const SINGLE_LINE_FIELDS: Record<string, keyof ParsedProjectFields> = {
	kategori: 'category',
	role: 'role',
	terafiliasi: 'associated_with',
	'terafiliasi dengan': 'associated_with',
	'tanggal mulai': 'date_start',
	'tanggal selesai': 'date_end',
	'live url': 'live_url',
	'seo meta title': 'meta_title'
};

const MULTI_LINE_FIELDS: Record<string, keyof ParsedProjectFields> = {
	deskripsi: 'short_description',
	'seo meta description': 'meta_description'
};

const SECTION_HEADINGS: Record<string, SectionType> = {
	problem: 'problem',
	solution: 'solution',
	result: 'result'
};

export const KNOWN_HEADING_LABELS = [
	'judul',
	...Object.keys(SINGLE_LINE_FIELDS),
	...Object.keys(MULTI_LINE_FIELDS),
	'kontributor',
	'tags',
	...Object.keys(SECTION_HEADINGS),
	'dokumentasi'
];

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
function docxToBlocks(html: string): Block[] {
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

/** A line is a heading only if it's an exact (case-insensitive) match to a
 *  known label — PDF text extraction has no bold/heading-size info to go on. */
function pdfToBlocks(text: string): Block[] {
	const blocks: Block[] = [];
	for (const raw of text.split(/\r?\n/)) {
		const line = raw.trim();
		if (!line) continue;
		const normalized = line
			.toLowerCase()
			.replace(/^#+\s*/, '')
			.replace(/[:.#]+$/, '')
			.trim();
		if (normalized === 'judul' || KNOWN_HEADING_LABELS.includes(normalized)) {
			blocks.push({ level: normalized === 'judul' ? 1 : 2, heading: normalized, headingRaw: line, paragraphs: [] });
		} else if (blocks.length) {
			blocks[blocks.length - 1].paragraphs.push(line);
		}
	}
	return blocks;
}

function linesOf(paragraphs: string[]) {
	return paragraphs
		.flatMap((p) => p.split('\n'))
		.map((l) => l.trim())
		.filter(Boolean);
}

function assembleFields(blocks: Block[]): { fields: ParsedProjectFields; warnings: string[] } {
	const fields: ParsedProjectFields = {
		title: '',
		short_description: '',
		category: '',
		role: '',
		contributors: [],
		associated_with: '',
		date_start: '',
		date_end: '',
		live_url: '',
		tags: [],
		meta_title: '',
		meta_description: '',
		sections: []
	};
	const warnings: string[] = [];

	let i = 0;
	while (i < blocks.length) {
		const b = blocks[i];
		const h = b.heading;

		if (h === 'judul' || b.level === 1) {
			fields.title = b.paragraphs.join(' ').trim();
		} else if (h in SINGLE_LINE_FIELDS) {
			const key = SINGLE_LINE_FIELDS[h];
			const val = (b.paragraphs[0] ?? '').trim();
			if (key === 'category') {
				const norm = val.toLowerCase();
				if (['web', 'app', 'design'].includes(norm)) fields.category = norm;
				else if (val) warnings.push(`Kategori "${val}" tidak dikenali (harus web/app/design) — dikosongkan.`);
			} else if (key === 'date_start' || key === 'date_end') {
				if (/^\d{4}-\d{2}-\d{2}$/.test(val)) fields[key] = val;
				else if (val) warnings.push(`"${b.headingRaw}" bernilai "${val}", harus format YYYY-MM-DD — dikosongkan.`);
			} else {
				(fields[key] as string) = val;
			}
		} else if (h in MULTI_LINE_FIELDS) {
			(fields[MULTI_LINE_FIELDS[h]] as string) = b.paragraphs.join('\n\n').trim();
		} else if (h === 'kontributor') {
			for (const line of linesOf(b.paragraphs)) {
				const m = line.match(/^(.*?)(?:\s*\((https?:\/\/[^\s)]+)\))?$/);
				const name = (m?.[1] ?? line).trim();
				if (name) fields.contributors.push({ name, url: m?.[2] ?? '' });
			}
		} else if (h === 'tags') {
			const raw = linesOf(b.paragraphs).join(',');
			fields.tags = raw
				.split(',')
				.map((t) => t.trim())
				.filter(Boolean);
		} else if (h in SECTION_HEADINGS) {
			const content = b.paragraphs.join('\n\n').trim();
			if (content) fields.sections.push({ type: SECTION_HEADINGS[h], title: '', content });
		} else if (h === 'dokumentasi') {
			let j = i + 1;
			let foundSubSlides = false;
			while (j < blocks.length && blocks[j].level === 3) {
				const content = blocks[j].paragraphs.join('\n\n').trim();
				fields.sections.push({ type: 'documentation', title: blocks[j].headingRaw, content });
				foundSubSlides = true;
				j++;
			}
			if (!foundSubSlides) {
				const content = b.paragraphs.join('\n\n').trim();
				if (content) fields.sections.push({ type: 'documentation', title: '', content });
			}
			i = j - 1;
		} else {
			warnings.push(`Heading "${b.headingRaw}" tidak dikenali — diabaikan.`);
		}
		i++;
	}

	if (!fields.title) warnings.push('Tidak menemukan "Judul" — isi manual di step Info Dasar.');

	return { fields, warnings };
}

export function parseProjectDoc(input: { html?: string; plainText?: string }) {
	const blocks = input.html ? docxToBlocks(input.html) : pdfToBlocks(input.plainText ?? '');
	return assembleFields(blocks);
}
