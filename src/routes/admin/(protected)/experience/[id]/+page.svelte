<script>
	import AdminForm from '$lib/components/admin/AdminForm.svelte';
	import DocImportBox from '$lib/components/admin/DocImportBox.svelte';
	import { ROLE_TYPE_OPTIONS } from '$lib/validation/schemas';

	let { data, form } = $props();

	const fields = [
		{ name: 'role_title', label: 'Jabatan', type: 'text', required: true },
		{ name: 'company_name', label: 'Perusahaan', type: 'text' },
		{ name: 'role_type', label: 'Tipe', type: 'select', options: ROLE_TYPE_OPTIONS },
		{ name: 'date_start', label: 'Tanggal mulai', type: 'date' },
		{ name: 'date_end', label: 'Tanggal selesai', type: 'date' },
		{ name: 'image_url', label: 'Gambar', type: 'file', accept: 'image/*', isImage: true, folder: 'experience' }
	];

	const TEMPLATE_HELP_TEXT = `Format yang didukung (heading, lalu isinya di baris berikutnya):

Jabatan               (wajib)
Perusahaan
Tipe                  -> Full-time / Part-time / Internship / Freelance /
                         Project-based / Volunteer
Tanggal Mulai         -> format YYYY-MM-DD
Tanggal Selesai       -> format YYYY-MM-DD

Untuk .docx: beri baris heading itu style "Heading 1/2/3" bawaan Word.
Untuk PDF: tulis labelnya di awal baris (boleh diikuti nilainya di baris
yang sama, mis. "Jabatan Frontend Developer").
Gambar tidak ikut terisi otomatis — tetap upload manual di bawah.`;

	let importedValues = $state({});
	function onImportResult({ fields }) {
		Object.assign(importedValues, fields);
	}

	let values = $derived({ ...(form?.values ?? data.item), ...importedValues });
	let errors = $derived(
		Object.fromEntries(Object.entries(form?.fieldErrors ?? {}).map(([k, v]) => [k, v?.[0]]))
	);
</script>

<svelte:head>
	<title>Admin · Edit Experience</title>
</svelte:head>

<div class="admin-page-header">
	<h1>Edit Experience</h1>
</div>

<DocImportBox resource="experience" templateHelp={TEMPLATE_HELP_TEXT} onResult={onImportResult} />

<AdminForm {fields} {values} {errors} formError={form?.error} cancelHref="/admin/experience" submitLabel="Simpan" />
