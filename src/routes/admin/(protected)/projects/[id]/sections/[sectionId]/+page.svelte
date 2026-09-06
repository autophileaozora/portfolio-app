<script>
	import AdminForm from '$lib/components/admin/AdminForm.svelte';

	let { data, form } = $props();

	const fields = [
		{ name: 'title', label: 'Judul', type: 'text' },
		{ name: 'content', label: 'Konten', type: 'textarea' },
		{ name: 'image_url', label: 'Gambar (opsional)', type: 'file', accept: 'image/*', isImage: true, folder: 'sections' }
	];

	let values = $derived(form?.values ?? data.section);
	let errors = $derived(
		Object.fromEntries(Object.entries(form?.fieldErrors ?? {}).map(([k, v]) => [k, v?.[0]]))
	);
</script>

<svelte:head>
	<title>Admin · Edit Section</title>
</svelte:head>

<div class="admin-page-header">
	<h1>Edit {data.section.type}</h1>
</div>

<AdminForm
	{fields}
	{values}
	{errors}
	formError={form?.error}
	cancelHref="/admin/projects/{data.section.project_id}/sections"
	submitLabel="Simpan"
/>
