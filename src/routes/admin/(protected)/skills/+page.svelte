<script>
	import AdminTable from '$lib/components/admin/AdminTable.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Admin · Skills</title>
</svelte:head>

<div class="admin-page-header">
	<h1>Skills</h1>
	<a class="btn-primary" href="/admin/skills/new">+ Tambah</a>
</div>

<AdminTable columns={[{ key: 'name', label: 'Nama' }]} rows={data.skills} basePath="/admin/skills" />
