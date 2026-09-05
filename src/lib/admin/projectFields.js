import { CATEGORY_OPTIONS } from '$lib/validation/schemas';

/** Shared field config for the project create/edit forms (both use AdminForm). */
export const projectFields = [
	{ name: 'title', label: 'Judul', type: 'text', required: true },
	{ name: 'slug', label: 'Slug (URL)', type: 'text', required: true },
	{ name: 'short_description', label: 'Deskripsi singkat', type: 'textarea' },
	{ name: 'category', label: 'Kategori', type: 'select', options: CATEGORY_OPTIONS },
	{ name: 'role', label: 'Role', type: 'text' },
	{ name: 'duration', label: 'Durasi', type: 'text' },
	{ name: 'contributors', label: 'Kontributor', type: 'text' },
	{ name: 'associated_with', label: 'Terafiliasi dengan', type: 'text' },
	{ name: 'date_start', label: 'Tanggal mulai', type: 'date' },
	{ name: 'date_end', label: 'Tanggal selesai', type: 'date' },
	{ name: 'live_url', label: 'Live URL', type: 'text' },
	{ name: 'thumbnail_url', label: 'Thumbnail', type: 'file', accept: 'image/*', isImage: true },
	{ name: 'tags', label: 'Tags (pisahkan dengan koma)', type: 'text' },
	{ name: 'is_published', label: 'Terbitkan di halaman publik', type: 'checkbox', default: false },
	{ name: 'is_featured', label: 'Tampilkan sebagai unggulan di Home', type: 'checkbox', default: false }
];
