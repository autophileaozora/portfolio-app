<script>
	import { page } from '$app/stores';
	import AdminTable from '$lib/components/admin/AdminTable.svelte';

	let { data } = $props();

	// The new/edit wizards redirect here on success (see their
	// +page.server.ts actions) rather than landing back on the same
	// form — the query param is this page's cue to show a confirmation
	// banner, since arriving here at all wasn't otherwise distinguishable
	// from "nothing happened".
	let successMessage = $derived(
		$page.url.searchParams.get('created')
			? 'Project baru berhasil ditambahkan.'
			: $page.url.searchParams.get('updated')
				? 'Perubahan berhasil disimpan.'
				: ''
	);

	let rows = data.projects;
</script>

<svelte:head>
	<title>Admin · Projects</title>
</svelte:head>

<div class="admin-page-header">
	<h1>Projects</h1>
	<a class="btn-primary" href="/admin/projects/new">+ Tambah</a>
</div>

{#if successMessage}
	<p class="form-success-banner">✓ {successMessage}</p>
{/if}

<AdminTable
	columns={[
		{ key: 'title', label: 'Judul' },
		{ key: 'category', label: 'Kategori' }
	]}
	{rows}
	basePath="/admin/projects"
/>
