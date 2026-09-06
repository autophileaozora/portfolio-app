import { CATEGORY_OPTIONS, PROJECT_ROLE_OPTIONS, SECTION_TYPES } from '$lib/validation/schemas';

const SECTION_TYPE_LABELS = {
	problem: 'Problem',
	solution: 'Solution',
	result: 'Final Result',
	documentation: 'Dokumentasi'
};

/**
 * Shared field config for the project create/edit forms (both use
 * AdminForm) — also reused by the public "request edit" form, minus the
 * admin-only fields (see projectPublicEditSchema / the request-edit route).
 */
export const projectFields = [
	{ name: 'title', label: 'Judul', type: 'text', required: true },
	{ name: 'slug', label: 'Slug (URL)', type: 'text', required: true },
	{ name: 'short_description', label: 'Deskripsi singkat', type: 'textarea' },
	{ name: 'category', label: 'Kategori', type: 'select', options: CATEGORY_OPTIONS },
	{ name: 'role', label: 'Role', type: 'searchable-select', options: PROJECT_ROLE_OPTIONS },
	// duration is no longer an input — always computed from date_start/date_end.
	{
		name: 'contributors_list',
		label: 'Kontributor',
		type: 'repeater',
		itemFields: [
			{ name: 'name', label: 'Nama' },
			{ name: 'url', label: 'Link sosial media (opsional)' }
		]
	},
	{ name: 'associated_with', label: 'Terafiliasi dengan', type: 'text' },
	{ name: 'date_start', label: 'Tanggal mulai', type: 'date' },
	{ name: 'date_end', label: 'Tanggal selesai', type: 'date' },
	{ name: 'live_url', label: 'Live URL', type: 'text' },
	{ name: 'thumbnail_url', label: 'Thumbnail', type: 'file', accept: 'image/*', isImage: true },
	{ name: 'tags', label: 'Tags (pisahkan dengan koma)', type: 'text' },
	{
		name: 'meta_title',
		label: 'SEO: Meta title (kosongkan untuk pakai Judul)',
		type: 'text'
	},
	{
		name: 'meta_description',
		label: 'SEO: Meta description (kosongkan untuk pakai Deskripsi singkat)',
		type: 'textarea'
	}
];

/** Admin-only fields, appended after projectFields on the admin new/edit forms. */
export const projectAdminOnlyFields = [
	{ name: 'is_published', label: 'Terbitkan di halaman publik', type: 'checkbox', default: false },
	{ name: 'is_featured', label: 'Tampilkan sebagai unggulan di Home', type: 'checkbox', default: false }
];

/**
 * Batch-add Problem/Solution/Result/Dokumentasi sections while creating a
 * project, instead of forcing a trip to "Kelola Sections" afterward. Only
 * on the new-project form — a project already has "Kelola Sections" for
 * this once it exists, so there's no need to duplicate it on the edit form.
 * See projects/new/+page.server.ts for how each row (incl. its per-row
 * image upload) gets inserted.
 */
export const newProjectSectionsField = {
	name: 'sections',
	label: 'Sections (Problem / Solution / Result / Dokumentasi)',
	type: 'repeater',
	itemFields: [
		{ name: 'type', label: 'Tipe', type: 'select', options: SECTION_TYPES.map((t) => ({ value: t, label: SECTION_TYPE_LABELS[t] })) },
		{ name: 'title', label: 'Judul' },
		{ name: 'content', label: 'Konten' },
		{ name: 'image_file', label: 'Gambar (opsional)', type: 'file', accept: 'image/*' }
	]
};
