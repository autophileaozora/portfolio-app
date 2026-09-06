/**
 * Doc-import for every admin resource that ISN'T Projects (which has its
 * own repeater/section fields — see parseProjectDoc.ts). These resources
 * are all "one flat record, a handful of label: value fields" — Experience,
 * Testimonials, Stats, Profile — so they share one generic label-map
 * assembler. Skills is the one exception (bulk: many names from one list-
 * style document, not a single record), handled separately below.
 */

import { type Block, docxToBlocks, docxHtmlToPlainText, pdfToBlocks, isPlaceholder, linesOf } from './docBlocks';
import { ROLE_TYPE_OPTIONS } from '$lib/validation/schemas';

export interface SimpleDocConfig {
	/** label (lowercase) -> field key, value taken from the first line only. */
	singleLineFields: Record<string, string>;
	/** label (lowercase) -> field key, value is every paragraph/line joined. */
	multiLineFields: Record<string, string>;
	/** field keys (from singleLineFields) that must be a YYYY-MM-DD date —
	 *  anything else is dropped with a warning instead of stored as-is. */
	dateFields?: Set<string>;
	/** field key -> allowed values (matched case-insensitively, normalized
	 *  to the option's canonical casing) — anything else is dropped with a
	 *  warning instead of stored as free text. */
	enumFields?: Record<string, string[]>;
}

export interface SimpleDocResult {
	fields: Record<string, string>;
	warnings: string[];
}

function assembleSimpleFields(
	blocks: ReturnType<typeof docxToBlocks>,
	paraJoin: string,
	config: SimpleDocConfig
): SimpleDocResult {
	const fields: Record<string, string> = {};
	const warnings: string[] = [];

	for (const b of blocks) {
		const h = b.heading;
		if (h in config.singleLineFields) {
			const key = config.singleLineFields[h];
			const val = (b.paragraphs[0] ?? '').trim();
			if (!val || isPlaceholder(val)) continue;
			if (config.dateFields?.has(key)) {
				if (/^\d{4}-\d{2}-\d{2}$/.test(val)) fields[key] = val;
				else warnings.push(`"${b.headingRaw}" bernilai "${val}", harus format YYYY-MM-DD — dikosongkan.`);
			} else if (config.enumFields?.[key]) {
				const match = config.enumFields[key].find((opt) => opt.toLowerCase() === val.toLowerCase());
				if (match) fields[key] = match;
				else warnings.push(`"${b.headingRaw}" bernilai "${val}" tidak dikenali — dikosongkan.`);
			} else {
				fields[key] = val;
			}
		} else if (h in config.multiLineFields) {
			const val = b.paragraphs.join(paraJoin).trim();
			if (val && !isPlaceholder(val)) fields[config.multiLineFields[h]] = val;
		} else {
			warnings.push(`Heading "${b.headingRaw}" tidak dikenali — diabaikan.`);
		}
	}

	return { fields, warnings };
}

function parseWithConfig(input: { html?: string; plainText?: string }, config: SimpleDocConfig): SimpleDocResult {
	const knownLabels = [...Object.keys(config.singleLineFields), ...Object.keys(config.multiLineFields)];
	if (input.html) return assembleSimpleFields(docxToBlocks(input.html), '\n\n', config);
	return assembleSimpleFields(pdfToBlocks(input.plainText ?? '', knownLabels), ' ', config);
}

export interface MultiRecordResult {
	records: Record<string, string>[];
	warnings: string[];
}

/**
 * Same label-map config as the single-record assembler above, but reads
 * MANY records out of one document — a new record starts every time a
 * level-1 heading is hit (same convention as Projects' "Judul", and as
 * pdfToBlocks assigns level 1 only to whichever label the caller passes
 * as its `recordStartLabel`). Everything between one level-1 heading and
 * the next belongs to that record.
 */
function assembleMultiRecords(blocks: Block[], paraJoin: string, config: SimpleDocConfig): MultiRecordResult {
	const records: Record<string, string>[] = [];
	const warnings: string[] = [];
	let current: Record<string, string> | null = null;

	for (const b of blocks) {
		const h = b.heading;

		if (b.level === 1) {
			if (current) records.push(current);
			current = {};
			const key = config.singleLineFields[h];
			const val = b.paragraphs.join(' ').trim();
			if (key && val && !isPlaceholder(val)) current[key] = val;
			continue;
		}

		if (!current) {
			warnings.push(`"${b.headingRaw}" ditemukan sebelum entry pertama dimulai — diabaikan.`);
			continue;
		}

		if (h in config.singleLineFields) {
			const key = config.singleLineFields[h];
			const val = (b.paragraphs[0] ?? '').trim();
			if (!val || isPlaceholder(val)) continue;
			if (config.dateFields?.has(key)) {
				if (/^\d{4}-\d{2}-\d{2}$/.test(val)) current[key] = val;
				else warnings.push(`"${b.headingRaw}" bernilai "${val}", harus format YYYY-MM-DD — dikosongkan.`);
			} else if (config.enumFields?.[key]) {
				const match = config.enumFields[key].find((opt) => opt.toLowerCase() === val.toLowerCase());
				if (match) current[key] = match;
				else warnings.push(`"${b.headingRaw}" bernilai "${val}" tidak dikenali — dikosongkan.`);
			} else {
				current[key] = val;
			}
		} else if (h in config.multiLineFields) {
			const val = b.paragraphs.join(paraJoin).trim();
			if (val && !isPlaceholder(val)) current[config.multiLineFields[h]] = val;
		} else {
			warnings.push(`Heading "${b.headingRaw}" tidak dikenali — diabaikan.`);
		}
	}
	if (current) records.push(current);
	if (!records.length) warnings.push('Tidak menemukan entry apa pun di dokumen ini.');

	return { records, warnings };
}

function parseMultiWithConfig(
	input: { html?: string; plainText?: string },
	config: SimpleDocConfig,
	recordStartLabel: string
): MultiRecordResult {
	const knownLabels = [...Object.keys(config.singleLineFields), ...Object.keys(config.multiLineFields)];
	if (input.html) return assembleMultiRecords(docxToBlocks(input.html), '\n\n', config);
	return assembleMultiRecords(pdfToBlocks(input.plainText ?? '', knownLabels, recordStartLabel), ' ', config);
}

// ---- Experience ----
const EXPERIENCE_CONFIG: SimpleDocConfig = {
	singleLineFields: {
		jabatan: 'role_title',
		perusahaan: 'company_name',
		tipe: 'role_type',
		'tanggal mulai': 'date_start',
		'tanggal selesai': 'date_end'
	},
	multiLineFields: {},
	dateFields: new Set(['date_start', 'date_end']),
	enumFields: { role_type: ROLE_TYPE_OPTIONS }
};
export function parseExperienceDoc(input: { html?: string; plainText?: string }) {
	return parseWithConfig(input, EXPERIENCE_CONFIG);
}

// Bulk variant (per the user's follow-up request): one uploaded document
// can list SEVERAL experience entries at once, each starting at a
// "Jabatan" heading (Heading 1 in .docx; first-on-its-block in PDF — see
// assembleMultiRecords). Lives on the Experience list page, not the
// single "Tambah Experience" form.
export interface ExperienceBulkRecord {
	role_title: string;
	company_name: string;
	role_type: string;
	date_start: string;
	date_end: string;
}
export interface ExperienceBulkResult {
	records: ExperienceBulkRecord[];
	warnings: string[];
}
export function parseExperienceBulkDoc(input: { html?: string; plainText?: string }): ExperienceBulkResult {
	const { records, warnings } = parseMultiWithConfig(input, EXPERIENCE_CONFIG, 'jabatan');
	return {
		records: records.map((r) => ({
			role_title: r.role_title ?? '',
			company_name: r.company_name ?? '',
			role_type: r.role_type ?? '',
			date_start: r.date_start ?? '',
			date_end: r.date_end ?? ''
		})),
		warnings
	};
}

// ---- Testimonials ----
const TESTIMONIAL_CONFIG: SimpleDocConfig = {
	singleLineFields: { nama: 'author_name', peran: 'author_role' },
	multiLineFields: { quote: 'quote' }
};
export function parseTestimonialDoc(input: { html?: string; plainText?: string }) {
	return parseWithConfig(input, TESTIMONIAL_CONFIG);
}

// ---- Stats ----
const STAT_CONFIG: SimpleDocConfig = {
	singleLineFields: { label: 'label', value: 'value' },
	multiLineFields: {}
};
export function parseStatDoc(input: { html?: string; plainText?: string }) {
	return parseWithConfig(input, STAT_CONFIG);
}

// ---- Profile ----
const PROFILE_CONFIG: SimpleDocConfig = {
	singleLineFields: {
		'nama lengkap': 'full_name',
		jabatan: 'title',
		lokasi: 'location',
		email: 'email',
		linkedin: 'social_linkedin',
		github: 'social_github',
		instagram: 'social_instagram',
		whatsapp: 'social_whatsapp',
		'teks ketersediaan': 'availability_text',
		'teks terhubung': 'connect_text',
		copyright: 'footer_copyright'
	},
	multiLineFields: { ringkasan: 'summary_paragraph' }
};
export function parseProfileDoc(input: { html?: string; plainText?: string }) {
	return parseWithConfig(input, PROFILE_CONFIG);
}

// ---- Skills (bulk) ----
// No headings/labels at all — the whole document is just a flat list of
// skill names, one per line and/or comma-separated ("React, Laravel,
// Figma..."), per the user's explicit choice to support bulk-adding many
// skills from a single uploaded document instead of one skill per upload.
export interface SkillsBulkResult {
	names: string[];
	warnings: string[];
}
export function parseSkillsBulkDoc(input: { html?: string; plainText?: string }): SkillsBulkResult {
	const text = input.html ? docxHtmlToPlainText(input.html) : (input.plainText ?? '');
	const rawEntries = linesOf(
		text
			.split(/\r?\n/)
			.flatMap((line) => line.split(','))
	);

	const seen = new Set<string>();
	const names: string[] = [];
	const warnings: string[] = [];
	for (const entry of rawEntries) {
		const name = entry.replace(/^[-•*\d.)\s]+/, '').trim();
		if (!name || isPlaceholder(name)) continue;
		if (name.length > 80) {
			warnings.push(`"${name.slice(0, 40)}..." terlalu panjang untuk nama skill — dilewati.`);
			continue;
		}
		const key = name.toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);
		names.push(name);
	}

	if (!names.length) warnings.push('Tidak menemukan nama skill apa pun di dokumen ini.');
	return { names, warnings };
}
