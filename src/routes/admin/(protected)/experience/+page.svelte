<script>
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import AdminTable from '$lib/components/admin/AdminTable.svelte';
	import DocImportBox from '$lib/components/admin/DocImportBox.svelte';
	import { ROLE_TYPE_OPTIONS } from '$lib/validation/schemas';

	let { data } = $props();

	const TEMPLATE_HELP_TEXT = `Bisa berisi BANYAK experience sekaligus — ulangi grup berikut untuk
tiap pengalaman:

Jabatan               (wajib — menandai entry baru dimulai)
Perusahaan
Tipe                  -> Full-time / Part-time / Internship / Freelance /
                         Project-based / Volunteer
Tanggal Mulai         -> format YYYY-MM-DD
Tanggal Selesai       -> format YYYY-MM-DD

Untuk .docx: beri baris "Jabatan" di tiap entry style Heading 1 bawaan
Word, baris label lain di bawahnya style Heading 2.
Untuk PDF: tulis labelnya di awal baris seperti biasa — baris "Jabatan"
menandai entry baru dimulai.
Gambar tidak ikut terisi otomatis — tetap upload manual lewat halaman
Edit tiap entry setelah ditambahkan.`;

	let pendingEntries = $state([]);
	let importWarnings = $state([]);
	let bulkSubmitting = $state(false);

	function onImportResult({ records, warnings }) {
		pendingEntries = (records ?? []).map((r) => ({ __id: crypto.randomUUID(), ...r }));
		importWarnings = warnings ?? [];
	}
	function removePending(i) {
		pendingEntries = pendingEntries.filter((_, idx) => idx !== i);
	}
	function entriesJson() {
		return JSON.stringify(pendingEntries.map(({ __id, ...rest }) => rest));
	}

	let successMessage = $derived(
		$page.url.searchParams.get('bulkAdded')
			? `${$page.url.searchParams.get('bulkAdded')} experience berhasil ditambahkan.`
			: ''
	);
</script>

<svelte:head>
	<title>Admin · Experience</title>
</svelte:head>

<div class="admin-page-header">
	<h1>Experience</h1>
	<a class="btn-primary" href="/admin/experience/new">+ Tambah</a>
</div>

{#if successMessage}
	<p class="form-success-banner">✓ {successMessage}</p>
{/if}

<DocImportBox resource="experience-bulk" templateHelp={TEMPLATE_HELP_TEXT} onResult={onImportResult} />

{#if importWarnings.length}
	<ul class="doc-import-warnings">
		{#each importWarnings as w (w)}
			<li>{w}</li>
		{/each}
	</ul>
{/if}

{#if pendingEntries.length}
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
		class="bulk-entries-form"
	>
		<div class="repeater-field">
			{#each pendingEntries as entry, i (entry.__id)}
				<div class="repeater-row">
					<input type="text" placeholder="Jabatan" bind:value={entry.role_title} />
					<input type="text" placeholder="Perusahaan" bind:value={entry.company_name} />
					<select bind:value={entry.role_type}>
						<option value="">— Tipe —</option>
						{#each ROLE_TYPE_OPTIONS as opt (opt)}
							<option value={opt}>{opt}</option>
						{/each}
					</select>
					<input type="date" bind:value={entry.date_start} />
					<input type="date" bind:value={entry.date_end} />
					<button
						type="button"
						class="repeater-remove"
						aria-label="Hapus entry"
						onclick={() => removePending(i)}
					>
						&times;
					</button>
				</div>
			{/each}
		</div>
		<input type="hidden" name="entries_json" value={entriesJson()} />
		<button type="submit" class="btn-primary" disabled={bulkSubmitting}>
			{bulkSubmitting ? 'Menambahkan...' : `Tambah ${pendingEntries.length} Experience`}
		</button>
	</form>
{/if}

<AdminTable
	columns={[
		{ key: 'role_title', label: 'Jabatan' },
		{ key: 'role_type', label: 'Tipe' }
	]}
	rows={data.experience}
	basePath="/admin/experience"
/>

<style>
	.bulk-entries-form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 1.25rem;
	}
</style>
