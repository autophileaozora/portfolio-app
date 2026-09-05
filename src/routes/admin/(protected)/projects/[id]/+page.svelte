<script>
	import AdminForm from '$lib/components/admin/AdminForm.svelte';
	import { projectFields } from '$lib/admin/projectFields.js';

	let { data, form } = $props();

	let values = $derived(form?.values ?? { ...data.project, tags: data.tagsText });
	let errors = $derived(
		Object.fromEntries(Object.entries(form?.fieldErrors ?? {}).map(([k, v]) => [k, v?.[0]]))
	);
</script>

<svelte:head>
	<title>Admin · Edit Project</title>
</svelte:head>

<div class="admin-page-header">
	<h1>Edit Project</h1>
	<a class="btn-secondary" href="/admin/projects/{data.project.id}/sections">Kelola Sections &rarr;</a>
</div>

<AdminForm
	fields={projectFields}
	{values}
	{errors}
	formError={form?.error}
	cancelHref="/admin/projects"
	submitLabel="Simpan"
/>
