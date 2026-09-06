<script>
	import AdminForm from '$lib/components/admin/AdminForm.svelte';
	import { projectFields, projectAdminOnlyFields } from '$lib/admin/projectFields.js';

	let { data, form } = $props();

	const fields = [...projectFields, ...projectAdminOnlyFields];

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

{#if data.pendingEditRequestCount > 0}
	<p class="form-success-banner" style="border-color: rgba(108,99,255,0.35); background: rgba(108,99,255,0.08); color: #4b3fd6;">
		Ada {data.pendingEditRequestCount} permintaan edit dari publik untuk project ini yang menunggu review —
		<a href="/admin/edit-requests">lihat di sini</a>.
	</p>
{/if}

<AdminForm
	{fields}
	{values}
	{errors}
	formError={form?.error}
	cancelHref="/admin/projects"
	submitLabel="Simpan"
/>
