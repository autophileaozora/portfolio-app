<script>
	import AdminForm from '$lib/components/admin/AdminForm.svelte';

	let { data, form } = $props();

	const fields = [{ name: 'name', label: 'Nama skill', type: 'text', required: true }];

	let values = $derived(form?.values ?? data.skill);
	let errors = $derived(
		Object.fromEntries(Object.entries(form?.fieldErrors ?? {}).map(([k, v]) => [k, v?.[0]]))
	);
</script>

<svelte:head>
	<title>Admin · Edit Skill</title>
</svelte:head>

<div class="admin-page-header">
	<h1>Edit Skill</h1>
</div>

<AdminForm {fields} {values} {errors} formError={form?.error} cancelHref="/admin/skills" submitLabel="Simpan" />
