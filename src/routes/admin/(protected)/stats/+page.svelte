<script>
	import AdminTable from '$lib/components/admin/AdminTable.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Admin · Stats</title>
</svelte:head>

<div class="admin-page-header">
	<h1>Stats</h1>
	<a class="btn-primary" href="/admin/stats/new">+ Tambah</a>
</div>

<AdminTable
	columns={[
		{ key: 'label', label: 'Label' },
		{ key: 'value', label: 'Value' }
	]}
	rows={data.stats}
	basePath="/admin/stats"
/>
