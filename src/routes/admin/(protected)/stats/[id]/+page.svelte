<script>
	import AdminForm from '$lib/components/admin/AdminForm.svelte';
	import DocImportBox from '$lib/components/admin/DocImportBox.svelte';

	let { data, form } = $props();

	const fields = [
		{ name: 'label', label: 'Label', type: 'text', required: true },
		{ name: 'value', label: 'Value', type: 'number', default: 0 }
	];

	const TEMPLATE_HELP_TEXT = `Format yang didukung (heading, lalu isinya di baris berikutnya):

Label                 (wajib)
Value                 -> angka

Untuk .docx: beri baris heading itu style "Heading 1/2/3" bawaan Word.
Untuk PDF: tulis labelnya di awal baris (boleh diikuti nilainya di baris
yang sama, mis. "Label Tahun di Bidang IT").`;

	let importedValues = $state({});
	function onImportResult({ fields }) {
		Object.assign(importedValues, fields);
	}

	let values = $derived({ ...(form?.values ?? data.stat), ...importedValues });
	let errors = $derived(
		Object.fromEntries(Object.entries(form?.fieldErrors ?? {}).map(([k, v]) => [k, v?.[0]]))
	);
</script>

<svelte:head>
	<title>Admin · Edit Stat</title>
</svelte:head>

<div class="admin-page-header">
	<h1>Edit Stat</h1>
</div>

<DocImportBox resource="stats" templateHelp={TEMPLATE_HELP_TEXT} onResult={onImportResult} />

<AdminForm {fields} {values} {errors} formError={form?.error} cancelHref="/admin/stats" submitLabel="Simpan" />
