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
		{ key: 'company_name', label: 'Perusahaan' },
		{ key: 'role_type', label: 'Tipe' },
		{ key: 'date_start', label: 'Mulai' },
		{ key: 'date_end', label: 'Selesai' }
	]}
	rows={data.experience}
	basePath="/admin/experience"
/>
