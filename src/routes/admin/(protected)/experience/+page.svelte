<script>
	import AdminTable from '$lib/components/admin/AdminTable.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Admin · Experience</title>
</svelte:head>

<div class="admin-page-header">
	<h1>Experience</h1>
	<a class="btn-primary" href="/admin/experience/new">+ Tambah</a>
</div>

<AdminTable
	columns={[
		{ key: 'role_title', label: 'Jabatan' },
		{ key: 'role_type', label: 'Tipe' }
	]}
	rows={data.experience}
	basePath="/admin/experience"
/>
