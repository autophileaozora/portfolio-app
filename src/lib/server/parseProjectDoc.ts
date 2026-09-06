/**
 * Deterministic (no AI) extraction of project-wizard fields from a
 * heading-based document template. Built on the generic block engine in
 * docBlocks.ts (shared with the other resources' importers) — this file
 * only owns the Project-specific field/section labels and assembly logic.
 *
 * Anything not matching a known heading is reported back as a warning
 * rather than silently dropped, so the admin knows what to fill in by
 * hand afterward.
 */

import { type Block, docxToBlocks, pdfToBlocks, isPlaceholder, linesOf } from './docBlocks';

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

/**
 * .docx paragraphs (<p> tags) are genuinely separate paragraphs, so
 * joining them with a blank line is correct. .pdf "paragraphs" are just
 * individual extracted lines — plain word-wrap, not real paragraph
 * breaks — so those need a plain space instead, or a normal wrapped
 * sentence ends up looking like several separate paragraphs.
 */
function assembleFields(blocks: Block[], paraJoin: string): { fields: ParsedProjectFields; warnings: string[] } {
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
			if (!val || isPlaceholder(val)) {
				// left blank on purpose (or explicitly marked "belum
				// dicantumkan" etc.) — nothing to assign, nothing to warn about.
			} else if (key === 'category') {
				const norm = val.toLowerCase();
				if (['web', 'app', 'design'].includes(norm)) fields.category = norm;
				else warnings.push(`Kategori "${val}" tidak dikenali (harus web/app/design) — dikosongkan.`);
			} else if (key === 'date_start' || key === 'date_end') {
				if (/^\d{4}-\d{2}-\d{2}$/.test(val)) fields[key] = val;
				else warnings.push(`"${b.headingRaw}" bernilai "${val}", harus format YYYY-MM-DD — dikosongkan.`);
			} else {
				(fields[key] as string) = val;
			}
		} else if (h in MULTI_LINE_FIELDS) {
			const val = b.paragraphs.join(paraJoin).trim();
			if (val && !isPlaceholder(val)) (fields[MULTI_LINE_FIELDS[h]] as string) = val;
		} else if (h === 'kontributor') {
			for (const line of linesOf(b.paragraphs)) {
				if (isPlaceholder(line)) continue;
				const m = line.match(/^(.*?)(?:\s*\((https?:\/\/[^\s)]+)\))?$/);
				const name = (m?.[1] ?? line).trim();
				if (name && !isPlaceholder(name)) fields.contributors.push({ name, url: m?.[2] ?? '' });
			}
		} else if (h === 'tags') {
			const raw = linesOf(b.paragraphs).join(',');
			fields.tags = raw
				.split(',')
				.map((t) => t.trim())
				.filter((t) => t && !isPlaceholder(t));
		} else if (h in SECTION_HEADINGS) {
			const content = b.paragraphs.join(paraJoin).trim();
			if (content && !isPlaceholder(content)) fields.sections.push({ type: SECTION_HEADINGS[h], title: '', content });
		} else if (h === 'dokumentasi') {
			let j = i + 1;
			let foundSubSlides = false;
			while (j < blocks.length && blocks[j].level === 3) {
				const content = blocks[j].paragraphs.join(paraJoin).trim();
				fields.sections.push({ type: 'documentation', title: blocks[j].headingRaw, content });
				foundSubSlides = true;
				j++;
			}
			if (!foundSubSlides) {
				const content = b.paragraphs.join(paraJoin).trim();
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
	if (input.html) return assembleFields(docxToBlocks(input.html), '\n\n');
	return assembleFields(pdfToBlocks(input.plainText ?? '', KNOWN_HEADING_LABELS, 'judul'), ' ');
}
