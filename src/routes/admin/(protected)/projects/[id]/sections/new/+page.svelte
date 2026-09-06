<script>
	import AdminForm from '$lib/components/admin/AdminForm.svelte';

	let { data, form } = $props();

	let fields = $derived([
		{ name: 'type', type: 'hidden', value: data.type },
		{ name: 'title', label: 'Judul', type: 'text' },
		{ name: 'content', label: 'Konten', type: 'textarea' },
		{ name: 'image_url', label: 'Gambar (opsional)', type: 'file', accept: 'image/*', isImage: true }
	]);

	let errors = $derived(
		Object.fromEntries(Object.entries(form?.fieldErrors ?? {}).map(([k, v]) => [k, v?.[0]]))
	);
</script>

<svelte:head>
	<title>Admin · Tambah Section</title>
</svelte:head>

<div class="admin-page-header">
	<h1>Tambah {data.type} — {data.project.title}</h1>
</div>

<AdminForm
	{fields}
	values={form?.values}
	{errors}
	formError={form?.error}
	cancelHref="/admin/projects/{data.project.id}/sections"
	submitLabel="Tambah"
/>
