<script>
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import AdminTable from '$lib/components/admin/AdminTable.svelte';
	import DocImportBox from '$lib/components/admin/DocImportBox.svelte';

	let { data } = $props();

	const TEMPLATE_HELP_TEXT = `Skills mendukung impor BANYAK sekaligus dari satu dokumen — tulis satu
nama skill per baris, dan/atau dipisahkan dengan koma, misalnya:

React, Laravel, Figma
Node.js
Adobe Premiere Pro

Tidak perlu heading/label apa pun — semua baris/kata yang dipisah koma
akan dibaca sebagai nama skill.`;

	let pendingNames = $state([]);
	let importWarnings = $state([]);
	let bulkSubmitting = $state(false);

	function onImportResult({ names, warnings }) {
		pendingNames = names ?? [];
		importWarnings = warnings ?? [];
	}
	function removePending(i) {
		pendingNames = pendingNames.filter((_, idx) => idx !== i);
	}

	let successMessage = $derived(
		$page.url.searchParams.get('bulkAdded')
			? `${$page.url.searchParams.get('bulkAdded')} skill berhasil ditambahkan.`
			: ''
	);
</script>

<svelte:head>
	<title>Admin · Skills</title>
</svelte:head>

<div class="admin-page-header">
	<h1>Skills</h1>
	<a class="btn-primary" href="/admin/skills/new">+ Tambah</a>
</div>

{#if successMessage}
	<p class="form-success-banner">✓ {successMessage}</p>
{/if}

<DocImportBox resource="skills" templateHelp={TEMPLATE_HELP_TEXT} onResult={onImportResult} />

{#if importWarnings.length}
	<ul class="doc-import-warnings">
		{#each importWarnings as w (w)}
			<li>{w}</li>
		{/each}
	</ul>
{/if}

{#if pendingNames.length}
	<form
		method="POST"
		action="?/bulkImport"
		use:enhance={() => {
			bulkSubmitting = true;
			return async ({ update }) => {
				await update();
				bulkSubmitting = false;
			};
		}}
		class="doc-import-bulk-form"
	>
		<div class="doc-import-skill-chips">
			{#each pendingNames as name, i (name)}
				<span class="doc-import-skill-chip">
					{name}
					<button type="button" aria-label="Hapus {name}" onclick={() => removePending(i)}>&times;</button>
				</span>
			{/each}
		</div>
		<input type="hidden" name="names_json" value={JSON.stringify(pendingNames)} />
		<button type="submit" class="btn-primary" disabled={bulkSubmitting}>
			{bulkSubmitting ? 'Menambahkan...' : `Tambah ${pendingNames.length} Skill`}
		</button>
	</form>
{/if}

<AdminTable columns={[{ key: 'name', label: 'Nama' }]} rows={data.skills} basePath="/admin/skills" />

<style>
	.doc-import-bulk-form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 1.25rem;
	}
</style>
