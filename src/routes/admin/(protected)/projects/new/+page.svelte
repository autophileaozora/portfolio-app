<script>
	import AdminForm from '$lib/components/admin/AdminForm.svelte';
	import { projectFields, projectAdminOnlyFields, newProjectSectionsField } from '$lib/admin/projectFields.js';

	let { form } = $props();

	const fields = [...projectFields, newProjectSectionsField, ...projectAdminOnlyFields];

	let errors = $derived(
		Object.fromEntries(Object.entries(form?.fieldErrors ?? {}).map(([k, v]) => [k, v?.[0]]))
	);
</script>

<svelte:head>
	<title>Admin · Tambah Project</title>
</svelte:head>

<div class="admin-page-header">
	<h1>Tambah Project</h1>
</div>

<AdminForm
	{fields}
	values={form?.values}
	{errors}
	formError={form?.error}
	cancelHref="/admin/projects"
	submitLabel="Tambah"
/>
