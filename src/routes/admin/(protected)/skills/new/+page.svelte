<script>
	import AdminForm from '$lib/components/admin/AdminForm.svelte';

	let { form } = $props();

	const fields = [
		{ name: 'name', label: 'Nama skill', type: 'text', required: true },
		{ name: 'display_order', label: 'Urutan', type: 'number', default: 0 }
	];

	let errors = $derived(
		Object.fromEntries(Object.entries(form?.fieldErrors ?? {}).map(([k, v]) => [k, v?.[0]]))
	);
</script>

<svelte:head>
	<title>Admin · Tambah Skill</title>
</svelte:head>

<div class="admin-page-header">
	<h1>Tambah Skill</h1>
</div>

<AdminForm {fields} values={form?.values} {errors} formError={form?.error} cancelHref="/admin/skills" submitLabel="Tambah" />
