import { z } from 'zod';

/** Empty-string form fields become null for nullable DB columns (dates, urls). */
const emptyToNull = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v);
const nullableText = (max: number) => z.preprocess(emptyToNull, z.string().trim().max(max).nullable());
const nullableDate = () => z.preprocess(emptyToNull, z.string().nullable());

export const skillSchema = z.object({
	name: z.string().trim().min(1, 'Nama wajib diisi.').max(80),
	display_order: z.coerce.number().int()
});

export const statSchema = z.object({
	label: z.string().trim().min(1, 'Label wajib diisi.').max(80),
	value: z.coerce.number().int().min(0, 'Value tidak boleh negatif.'),
	display_order: z.coerce.number().int()
});

export const experienceSchema = z.object({
	role_title: z.string().trim().min(1, 'Jabatan wajib diisi.').max(120),
	role_type: z.string().trim().max(60).optional().default(''),
	company_name: z.string().trim().max(120).optional().default(''),
	date_start: nullableDate(),
	date_end: nullableDate(),
	display_order: z.coerce.number().int()
});

export const testimonialSchema = z.object({
	author_name: z.string().trim().min(1, 'Nama wajib diisi.').max(120),
	author_role: z.string().trim().max(120).optional().default(''),
	quote: z.string().trim().min(1, 'Quote wajib diisi.').max(1000),
	is_published: z.boolean(),
	display_order: z.coerce.number().int()
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
	summary_paragraph: z.string().trim().max(2000).optional().default('')
});
