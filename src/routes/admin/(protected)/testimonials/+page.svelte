<script>
	import AdminTable from '$lib/components/admin/AdminTable.svelte';

	let { data } = $props();

	let rows = data.testimonials;
</script>

<svelte:head>
	<title>Admin · Testimonials</title>
</svelte:head>

<div class="admin-page-header">
	<h1>Testimonials</h1>
	<a class="btn-primary" href="/admin/testimonials/new">+ Tambah</a>
</div>

<AdminTable
	columns={[
		{ key: 'author_name', label: 'Nama' },
		{ key: 'author_role', label: 'Peran' }
	]}
	{rows}
	basePath="/admin/testimonials"
/>
