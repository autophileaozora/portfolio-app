<script>
	import AdminForm from '$lib/components/admin/AdminForm.svelte';
	import '$lib/styles/admin.css';
	import { projectFields } from '$lib/admin/projectFields.js';

	let { data, form } = $props();

	// Stay on step 2 if a submission just failed validation, so errors are visible.
	let step = $state(form && !form.success ? 2 : 1);
	let requesterName = $state(form?.values?.requester_name ?? '');
	let requesterInstagram = $state(form?.values?.requester_instagram ?? '');
	let requesterWhatsapp = $state(form?.values?.requester_whatsapp ?? '');

	// Anonymous visitors can't write to storage (see uploads.ts / storage
	// policies — authenticated only), so thumbnail becomes a pasted URL
	// instead of a file upload here, unlike the admin form. meta_title/
	// meta_description are dropped entirely — SEO stays admin-only.
	const publicFields = projectFields
		.filter((f) => f.name !== 'meta_title' && f.name !== 'meta_description')
		.map((f) =>
			f.name === 'thumbnail_url'
				? { name: 'thumbnail_url', label: 'URL Thumbnail (opsional, tempel link gambar)', type: 'text' }
				: f
		);

	const documentationField = {
		name: 'documentation_slides',
		label: 'Slide Dokumentasi',
		type: 'repeater',
		itemFields: [
			{ name: 'title', label: 'Judul' },
			{ name: 'content', label: 'Konten' },
			{ name: 'image_url', label: 'URL Gambar (opsional)' }
		]
	};

	let editFields = $derived([
		{ name: 'requester_name', type: 'hidden', value: requesterName },
		{ name: 'requester_instagram', type: 'hidden', value: requesterInstagram },
		{ name: 'requester_whatsapp', type: 'hidden', value: requesterWhatsapp },
		...publicFields,
		documentationField
	]);

	let editValues = $derived(
		form?.values ?? { ...data.project, tags: data.tagsText, documentation_slides: data.documentationSlides }
	);
	let errors = $derived(
		Object.fromEntries(Object.entries(form?.fieldErrors ?? {}).map(([k, v]) => [k, v?.[0]]))
	);

	function goToStep2(e) {
		e.preventDefault();
		if (!requesterName.trim() || !requesterInstagram.trim()) return;
		step = 2;
	}
</script>

<svelte:head>
	<title>Request Edit — {data.project.title}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="request-edit-page">
	{#if form?.success}
		<div class="admin-page-header">
			<h1>Terima kasih!</h1>
		</div>
		<p>
			Permintaan edit kamu untuk <strong>{data.project.title}</strong> sudah terkirim dan menunggu review admin.
			Perubahan baru akan tayang setelah disetujui.
		</p>
		<a class="btn-secondary" href="/projects/{data.project.slug}">&larr; Kembali ke project</a>
	{:else if step === 1}
		<div class="admin-page-header">
			<h1>Request Edit: {data.project.title}</h1>
		</div>
		<p class="dashboard-sub">Sebelum lanjut, kami perlu tahu siapa yang mengusulkan perubahan ini.</p>
		<form class="admin-form" onsubmit={goToStep2}>
			<label>
				Nama
				<input type="text" bind:value={requesterName} required />
			</label>
			<label>
				Username Instagram
				<input type="text" bind:value={requesterInstagram} required placeholder="tanpa @" />
			</label>
			<label>
				Nomor WhatsApp (opsional)
				<input type="text" bind:value={requesterWhatsapp} />
			</label>
			<div class="form-actions">
				<button type="submit" class="btn-primary">Lanjut ke Edit &rarr;</button>
				<a class="btn-secondary" href="/projects/{data.project.slug}">Batal</a>
			</div>
		</form>
	{:else}
		<div class="admin-page-header">
			<h1>Edit: {data.project.title}</h1>
		</div>
		<p class="dashboard-sub">
			Perubahan kamu akan direview dulu oleh admin sebelum tayang di halaman publik. Daftar "Slide Dokumentasi" di
			bawah sudah diisi slide yang ada sekarang — edit, hapus, atau tambah baris sesuai kebutuhan; daftar akhir yang
			kamu kirim akan menggantikan slide yang ada.
		</p>
		<AdminForm
			fields={editFields}
			values={editValues}
			{errors}
			formError={form?.error}
			cancelHref="/projects/{data.project.slug}"
			submitLabel="Kirim Permintaan Edit"
		/>
	{/if}
</div>

<style>
	.request-edit-page {
		max-width: 640px;
		margin: 3rem auto;
		padding: 0 1.5rem 3rem;
	}
</style>
