<script>
	import { enhance } from '$app/forms';
	import AdminTable from '$lib/components/admin/AdminTable.svelte';

	let { data, form } = $props();

	let syncing = $state(false);
</script>

<svelte:head>
	<title>Admin · Stats</title>
</svelte:head>

<div class="admin-page-header">
	<h1>Stats</h1>
	<a class="btn-primary" href="/admin/stats/new">+ Tambah</a>
</div>

<p class="doc-import-sub" style="margin-bottom: 1rem;">
	4 stat pertama (Impactful Projects, Technologies, People Has Collaborate, Years in IT Fields)
	dihitung otomatis dari data Projects/Skills/Experience yang sudah ada. Boleh diedit manual di
	sini kapan saja — perubahan manual itu akan tetap dipakai sampai ada perubahan baru di Projects/
	Skills/Experience, baru nilainya dihitung ulang dan menimpa isian manual tadi.
</p>

<form
	method="POST"
	action="?/recompute"
	use:enhance={() => {
		syncing = true;
		return async ({ update }) => {
			await update();
			syncing = false;
		};
	}}
	style="margin-bottom: 1.25rem;"
>
	<button type="submit" class="btn-secondary" disabled={syncing}>
		{syncing ? 'Menyinkronkan...' : '↻ Sinkronkan Sekarang'}
	</button>
	{#if form?.synced}
		<span class="upload-status" style="margin-left: 0.6rem;">✓ Berhasil disinkronkan.</span>
	{/if}
</form>

<AdminTable
	columns={[
		{ key: 'label', label: 'Label' },
		{ key: 'value', label: 'Value' }
	]}
	rows={data.stats}
	basePath="/admin/stats"
/>
