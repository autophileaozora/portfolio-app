<script>
	import AdminForm from '$lib/components/admin/AdminForm.svelte';

	let { data, form } = $props();

	const fields = [
		{ name: 'label', label: 'Label', type: 'text', required: true },
		{ name: 'value', label: 'Value', type: 'number', default: 0 }
	];

	let values = $derived(form?.values ?? data.stat);
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

<AdminForm {fields} {values} {errors} formError={form?.error} cancelHref="/admin/stats" submitLabel="Simpan" />
