<script>
	import AdminForm from '$lib/components/admin/AdminForm.svelte';

	let { form } = $props();

	const fields = [
		{ name: 'label', label: 'Label', type: 'text', required: true },
		{ name: 'value', label: 'Value', type: 'number', default: 0 }
	];

	let errors = $derived(
		Object.fromEntries(Object.entries(form?.fieldErrors ?? {}).map(([k, v]) => [k, v?.[0]]))
	);
</script>

<svelte:head>
	<title>Admin · Tambah Stat</title>
</svelte:head>

<div class="admin-page-header">
	<h1>Tambah Stat</h1>
</div>

<AdminForm {fields} values={form?.values} {errors} formError={form?.error} cancelHref="/admin/stats" submitLabel="Tambah" />
