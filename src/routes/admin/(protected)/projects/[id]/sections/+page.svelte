<script>
	import AdminTable from '$lib/components/admin/AdminTable.svelte';

	let { data } = $props();

	const GROUPS = [
		{ type: 'problem', label: 'Problems' },
		{ type: 'solution', label: 'Solutions' },
		{ type: 'result', label: 'Final Results' },
		{ type: 'documentation', label: 'Dokumentasi' }
	];

	function rowsFor(type) {
		return data.sections.filter((s) => s.type === type);
	}
</script>

<svelte:head>
	<title>Admin · Sections — {data.project.title}</title>
</svelte:head>

<div class="admin-page-header">
	<h1>Sections: {data.project.title}</h1>
	<a class="btn-secondary" href="/admin/projects/{data.project.id}">&larr; Kembali ke Project</a>
</div>

{#each GROUPS as group (group.type)}
	<div class="section-group">
		<div class="admin-page-header">
			<h2>{group.label}</h2>
			<a class="btn-primary" href="/admin/projects/{data.project.id}/sections/new?type={group.type}">+ Tambah</a>
		</div>
		<AdminTable
			columns={[
				{ key: 'title', label: 'Judul' },
				{ key: 'content', label: 'Konten' }
			]}
			rows={rowsFor(group.type)}
			basePath="/admin/projects/{data.project.id}/sections"
		/>
	</div>
{/each}
