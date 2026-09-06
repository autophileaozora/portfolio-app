import { z } from 'zod';

/** Empty-string form fields become null for nullable DB columns (dates, urls). */
const emptyToNull = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v);
const nullableText = (max: number) => z.preprocess(emptyToNull, z.string().trim().max(max).nullable());
const nullableDate = () => z.preprocess(emptyToNull, z.string().nullable());

/**
 * display_order is intentionally NOT part of these schemas — it's assigned
 * server-side on create (max + 1) and changed only via the AdminTable
 * position <select>, which calls the reorder_ranked_item RPC directly. The
 * create/edit forms never submit it.
 */

export const skillSchema = z.object({
	name: z.string().trim().min(1, 'Nama wajib diisi.').max(80)
});

export const statSchema = z.object({
	label: z.string().trim().min(1, 'Label wajib diisi.').max(80),
	value: z.coerce.number().int().min(0, 'Value tidak boleh negatif.')
});

export const ROLE_TYPE_OPTIONS = ['Full-time', 'Part-time', 'Internship', 'Freelance', 'Project-based', 'Volunteer'];

export const experienceSchema = z.object({
	role_title: z.string().trim().min(1, 'Jabatan wajib diisi.').max(120),
	role_type: z.enum(['', ...ROLE_TYPE_OPTIONS]).optional().default(''),
	company_name: z.string().trim().max(120).optional().default(''),
	date_start: nullableDate(),
	date_end: nullableDate(),
	image_url: nullableText(500)
});

export const testimonialSchema = z.object({
	author_name: z.string().trim().min(1, 'Nama wajib diisi.').max(120),
	author_role: z.string().trim().max(120).optional().default(''),
	quote: z.string().trim().min(1, 'Quote wajib diisi.').max(1000),
	is_published: z.boolean()
});

export const CATEGORY_OPTIONS = ['web', 'app', 'design'];

/**
 * Searchable-select suggestions for "Role" (see AdminForm's 'searchable-select'
 * field type — a <datalist>-backed input, so this is a curated starting set,
 * not a hard enum: typing something not on the list is still accepted, which
 * matters once real project roles grow beyond what's listed here.
 */
export const PROJECT_ROLE_OPTIONS = [
	'UI/UX Designer',
	'Frontend Developer',
	'Backend Developer',
	'Full Stack Developer',
	'Mobile Developer',
	'DevOps Engineer',
	'IT Support',
	'Network Engineer',
	'System Administrator',
	'Data Analyst',
	'Data Scientist',
	'QA Engineer',
	'Project Manager',
	'Product Manager',
	'Business Analyst',
	'Graphic Designer',
	'Video Editor',
	'Content Writer',
	'Digital Marketer',
	'AV Technician'
];

const contributorSchema = z.object({
	name: z.string().trim().min(1, 'Nama kontributor wajib diisi.').max(120),
	url: nullableText(500)
});

/**
 * The contributor repeater (AdminForm's 'repeater' field type) serializes
 * its rows to a JSON string in a hidden input on submit — parse that back
 * into an array here before validating each entry.
 */
export const contributorsListSchema = z.preprocess((v) => {
	if (typeof v !== 'string') return v;
	try {
		return JSON.parse(v);
	} catch {
		return [];
	}
}, z.array(contributorSchema).max(30));

export const projectSchema = z.object({
	slug: z
		.string()
		.trim()
		.toLowerCase()
		.min(1, 'Slug wajib diisi.')
		.max(120)
		.regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Slug hanya boleh huruf kecil, angka, dan tanda "-".'),
	title: z.string().trim().min(1, 'Judul wajib diisi.').max(200),
	short_description: z.string().trim().max(2000).optional().default(''),
	role: z.string().trim().max(120).optional().default(''),
	// duration is intentionally NOT here — it's always computed from
	// date_start/date_end at render time (see lib/utils/formatDuration.js),
	// never typed by hand or stored.
	category: z.enum(['', ...CATEGORY_OPTIONS]).optional().default(''),
	thumbnail_url: nullableText(500),
	contributors_list: contributorsListSchema,
	associated_with: z.string().trim().max(300).optional().default(''),
	date_start: nullableDate(),
	date_end: nullableDate(),
	live_url: nullableText(500),
	meta_title: nullableText(70),
	meta_description: nullableText(200),
	is_published: z.boolean(),
	is_featured: z.boolean()
});

/** Fields a public "request edit" submission may propose changes to —
 * everything content-related, but NOT slug (breaks the URL) or the
 * publish/feature curation flags (admin-only decisions). */
export const projectPublicEditSchema = projectSchema.omit({
	slug: true,
	is_published: true,
	is_featured: true
});

export const editRequestGateSchema = z.object({
	requester_name: z.string().trim().min(1, 'Nama wajib diisi.').max(120),
	requester_instagram: z.string().trim().min(1, 'Username Instagram wajib diisi.').max(60),
	requester_whatsapp: nullableText(30)
});

export const SECTION_TYPES = ['problem', 'solution', 'result', 'documentation'] as const;

export const sectionSchema = z.object({
	type: z.enum(SECTION_TYPES),
	title: z.string().trim().max(200).optional().default(''),
	content: z.string().trim().max(3000).optional().default('')
});

export const sectionContentSchema = sectionSchema.omit({ type: true });

export const messageSchema = z.object({
	// formData.get() returns null (not undefined) for a field that isn't
	// present at all, which z.optional() doesn't accept — normalize first.
	sender_name: z.preprocess((v) => v ?? '', z.string().trim().max(120)),
	is_anonymous: z.boolean(),
	content: z.string().trim().min(1, 'Pesan tidak boleh kosong.').max(2000)
});

export const profileSchema = z.object({
	full_name: z.string().trim().min(1, 'Nama wajib diisi.').max(120),
	title: z.string().trim().max(120).optional().default(''),
	location: z.string().trim().max(120).optional().default(''),
	avatar_url: nullableText(500),
	email: z.string().trim().max(160).optional().default(''),
	social_linkedin: nullableText(500),
	social_github: nullableText(500),
	social_instagram: nullableText(500),
	social_whatsapp: nullableText(500),
	cv_url: nullableText(500),
	resume_url: nullableText(500),
	summary_paragraph: z.string().trim().max(2000).optional().default(''),
	availability_text: z.string().trim().max(160).optional().default('Available for work & Discussions'),
	connect_text: z.string().trim().max(160).optional().default("Let's Connected"),
	footer_copyright: z.string().trim().max(200).optional().default('© 2026 Hello Imanuel. All Rights Reserved.')
});
