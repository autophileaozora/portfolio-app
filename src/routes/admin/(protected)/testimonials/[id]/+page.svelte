<script>
	import AdminForm from '$lib/components/admin/AdminForm.svelte';
	import DocImportBox from '$lib/components/admin/DocImportBox.svelte';

	let { data, form } = $props();

	const fields = [
		{ name: 'author_name', label: 'Nama', type: 'text', required: true },
		{ name: 'author_role', label: 'Peran (mis. Rekan Kerja)', type: 'text' },
		{ name: 'quote', label: 'Quote', type: 'textarea', required: true },
		{ name: 'is_published', label: 'Terbitkan di halaman publik', type: 'checkbox' }
	];

	const TEMPLATE_HELP_TEXT = `Format yang didukung (heading, lalu isinya di baris berikutnya):

Nama                  (wajib)
Peran
Quote                 (wajib)

Untuk .docx: beri baris heading itu style "Heading 1/2/3" bawaan Word.
Untuk PDF: tulis labelnya di awal baris (boleh diikuti nilainya di baris
yang sama, mis. "Nama Abraham").`;

	let importedValues = $state({});
	function onImportResult({ fields }) {
		Object.assign(importedValues, fields);
	}

	let values = $derived({ ...(form?.values ?? data.testimonial), ...importedValues });
	let errors = $derived(
		Object.fromEntries(Object.entries(form?.fieldErrors ?? {}).map(([k, v]) => [k, v?.[0]]))
	);
</script>

<svelte:head>
	<title>Admin · Edit Testimonial</title>
</svelte:head>

<div class="admin-page-header">
	<h1>Edit Testimonial</h1>
</div>

<DocImportBox resource="testimonials" templateHelp={TEMPLATE_HELP_TEXT} onResult={onImportResult} />

<AdminForm {fields} {values} {errors} formError={form?.error} cancelHref="/admin/testimonials" submitLabel="Simpan" />
