<script>
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	const req = $derived(data.editRequest);
	const project = $derived(req.projects);
	const proposed = $derived(req.proposed_changes);

	function contributorsSummary(list) {
		if (!Array.isArray(list) || !list.length) return '—';
		return list.map((c) => (c?.url ? `${c.name} (${c.url})` : c?.name)).join(', ');
	}
	function tagsSummary(list) {
		if (!Array.isArray(list) || !list.length) return '—';
		return list.join(', ');
	}
	function slidesSummary(list) {
		if (!Array.isArray(list) || !list.length) return '(kosong)';
		return list.map((s) => s.title || '(tanpa judul)').join(' | ');
	}
	function currentTags(p) {
		return (p.project_tags ?? []).map((pt) => pt.tags?.label).filter(Boolean);
	}
	function fmt(v) {
		if (v === null || v === undefined || v === '') return '—';
		return String(v);
	}

	// meta_title/meta_description are never in `proposed` — public
	// submissions can't touch SEO fields at all (see projectPublicEditSchema).
	const FIELDS = [
		{ key: 'title', label: 'Judul' },
		{ key: 'short_description', label: 'Deskripsi singkat' },
		{ key: 'role', label: 'Role' },
		{ key: 'category', label: 'Kategori' },
		{ key: 'associated_with', label: 'Terafiliasi dengan' },
		{ key: 'date_start', label: 'Tanggal mulai' },
		{ key: 'date_end', label: 'Tanggal selesai' },
		{ key: 'live_url', label: 'Live URL' },
		{ key: 'thumbnail_url', label: 'Thumbnail URL' }
	];

	let rejecting = $state(false);
</script>

<svelte:head>
	<title>Admin · Review Edit Request</title>
</svelte:head>

<div class="admin-page-header">
	<h1>Review Permintaan Edit</h1>
	<a class="btn-secondary" href="/admin/edit-requests">&larr; Kembali</a>
</div>

<div class="admin-form" style="max-width:none; margin-bottom:1.5rem;">
	<p><strong>Project:</strong> {project.title} ({project.slug})</p>
	<p><strong>Pengusul:</strong> {req.requester_name} — Instagram @{req.requester_instagram}
		{#if req.requester_whatsapp}— WhatsApp {req.requester_whatsapp}{/if}
	</p>
	<p><strong>Status:</strong> {req.status}</p>
	{#if req.admin_note}<p><strong>Catatan admin:</strong> {req.admin_note}</p>{/if}
</div>

{#if form?.error}
	<p class="form-error-banner">{form.error}</p>
{/if}

<div class="admin-table-wrap" style="margin-bottom:1.5rem;">
	<div class="admin-table-scroll">
		<table class="admin-table">
			<thead>
				<tr>
					<th>Field</th>
					<th>Saat ini</th>
					<th>Diusulkan</th>
				</tr>
			</thead>
			<tbody>
				{#each FIELDS as f (f.key)}
					{@const before = fmt(project[f.key])}
					{@const after = fmt(proposed[f.key])}
					<tr>
						<td>{f.label}</td>
						<td>{before}</td>
						<td style={before !== after ? 'color:#15803d;font-weight:600;' : ''}>{after}</td>
					</tr>
				{/each}
				<tr>
					<td>Kontributor</td>
					<td>{contributorsSummary(project.contributors_list)}</td>
					<td>{contributorsSummary(proposed.contributors_list)}</td>
				</tr>
				<tr>
					<td>Tags</td>
					<td>{tagsSummary(currentTags(project))}</td>
					<td>{tagsSummary(proposed.tags)}</td>
				</tr>
				<tr>
					<td>Slide Dokumentasi</td>
					<td>{slidesSummary(data.currentDocumentationSlides)}</td>
					<td>{slidesSummary(proposed.documentation_slides)}</td>
				</tr>
			</tbody>
		</table>
	</div>
</div>

{#if Array.isArray(proposed.documentation_slides) && proposed.documentation_slides.length}
	<div class="admin-form" style="max-width:none; margin-bottom:1.5rem;">
		<h3 style="margin-top:0;">Detail Slide Dokumentasi yang Diusulkan</h3>
		<p class="dashboard-sub">
			Menyetujui akan mengganti seluruh slide dokumentasi project ini dengan daftar di bawah ini.
		</p>
		<div class="edit-request-slides">
			{#each proposed.documentation_slides as slide, i (i)}
				<div class="edit-request-slide">
					{#if slide.image_url}
						<img src={slide.image_url} alt={slide.title || ''} class="edit-request-slide-image" />
					{/if}
					<strong>{slide.title || '(tanpa judul)'}</strong>
					<p>{slide.content || '—'}</p>
				</div>
			{/each}
		</div>
	</div>
{/if}

{#if req.status === 'pending'}
	<div class="form-actions">
		<form method="POST" action="?/approve" use:enhance>
			<button type="submit" class="btn-primary">Setujui &amp; Terapkan</button>
		</form>

		{#if !rejecting}
			<button type="button" class="btn-secondary" onclick={() => (rejecting = true)}>Tolak</button>
		{:else}
			<form method="POST" action="?/reject" use:enhance style="display:flex; gap:0.5rem; align-items:center;">
				<input type="text" name="admin_note" placeholder="Alasan penolakan (opsional)" />
				<button type="submit" class="btn-danger">Konfirmasi Tolak</button>
				<button type="button" class="btn-plain" onclick={() => (rejecting = false)}>Batal</button>
			</form>
		{/if}
	</div>
{/if}

<style>
	.edit-request-slides {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 1rem;
	}

	.edit-request-slide {
		border: 1px solid var(--admin-border, #e2e2e2);
		border-radius: 8px;
		padding: 0.75rem;
	}

	.edit-request-slide p {
		margin: 0.25rem 0 0;
		font-size: 0.9rem;
		opacity: 0.8;
	}

	.edit-request-slide-image {
		width: 100%;
		max-height: 140px;
		object-fit: cover;
		border-radius: 6px;
		margin-bottom: 0.5rem;
	}
</style>

