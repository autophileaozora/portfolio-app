<script>
	import { uploadViaSignedUrl } from '$lib/admin/uploadViaSignedUrl.js';

	/**
	 * Generic "Isi Otomatis dari Dokumen" upload box for every admin
	 * resource besides Projects (which has its own bespoke wizard-step
	 * version — see projects/new's onImportDocChange). Uploads straight to
	 * Supabase Storage (folder 'imports') via a signed URL, then asks
	 * /admin/api/parse-admin-doc to extract fields for `resource`; the
	 * parent decides what to do with the result via `onResult`.
	 *
	 * `onResult` receives the raw parsed payload — `{ fields, warnings }`
	 * for the single-record resources, `{ names, warnings }` for Skills'
	 * bulk mode — the parent knows which shape to expect for its own
	 * `resource`.
	 */
	let { resource, templateHelp, onResult } = $props();

	let showHelp = $state(false);
	let state = $state({ uploading: false, error: '', warnings: [], imported: false });

	async function onFileChange(e) {
		const file = e.currentTarget.files?.[0];
		if (!file) return;
		state = { uploading: true, error: '', warnings: [], imported: false };
		try {
			const url = await uploadViaSignedUrl(file, 'imports');
			const res = await fetch('/admin/api/parse-admin-doc', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ url, filename: file.name, resource })
			});
			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				throw new Error(body.message || 'Gagal membaca dokumen.');
			}
			const data = await res.json();
			onResult(data);
			state = { uploading: false, error: '', warnings: data.warnings ?? [], imported: true };
		} catch (err) {
			state = {
				uploading: false,
				error: err instanceof Error ? err.message : 'Gagal impor dokumen.',
				warnings: [],
				imported: false
			};
		}
		e.currentTarget.value = '';
	}
</script>

<div class="doc-import-box">
	<div class="doc-import-header">
		<i class="fa-solid fa-file-import"></i>
		<span>Isi Otomatis dari Dokumen (opsional)</span>
	</div>
	<p class="doc-import-sub">
		Upload .docx atau PDF yang mengikuti format heading baku —
		<button type="button" class="doc-import-link-btn" onclick={() => (showHelp = !showHelp)}>
			{showHelp ? 'sembunyikan formatnya' : 'lihat formatnya'}
		</button>.
	</p>
	{#if showHelp}
		<pre class="doc-import-template-help">{templateHelp}</pre>
	{/if}
	<input type="file" accept=".docx,.pdf" onchange={onFileChange} />
	{#if state.uploading}
		<span class="upload-status">Membaca dokumen...</span>
	{:else if state.error}
		<span class="field-error">{state.error}</span>
	{:else if state.imported}
		<span class="upload-status">✓ Konten berhasil diisi dari dokumen.</span>
	{/if}
	{#if state.warnings.length}
		<ul class="doc-import-warnings">
			{#each state.warnings as w (w)}
				<li>{w}</li>
			{/each}
		</ul>
	{/if}
</div>
