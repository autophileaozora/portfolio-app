<script>
	import AdminTable from '$lib/components/admin/AdminTable.svelte';

	let { data } = $props();

	let rows = $derived(
		data.projects.map((p) => ({
			...p,
			is_published_label: p.is_published ? 'Ya' : 'Tidak',
			is_featured_label: p.is_featured ? 'Ya' : 'Tidak'
		}))
	);
</script>

<svelte:head>
	<title>Admin · Projects</title>
</svelte:head>

<div class="admin-page-header">
	<h1>Projects</h1>
	<a class="btn-primary" href="/admin/projects/new">+ Tambah</a>
</div>

<AdminTable
	columns={[
		{ key: 'title', label: 'Judul' },
		{ key: 'slug', label: 'Slug' },
		{ key: 'category', label: 'Kategori' },
		{ key: 'is_published_label', label: 'Terbit' },
		{ key: 'is_featured_label', label: 'Unggulan' }
	]}
	{rows}
	basePath="/admin/projects"
/>
