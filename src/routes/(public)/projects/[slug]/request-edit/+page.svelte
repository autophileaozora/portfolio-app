<script>
	import AdminForm from '$lib/components/admin/AdminForm.svelte';
	import '$lib/styles/admin.css';
	import { projectFields } from '$lib/admin/projectFields.js';
	import { getDictionary } from '$lib/i18n';

	let { data, form } = $props();
	// Only this page's own chrome (headings, step-1 fields, buttons) is
	// translated — the step-2 form fields come from projectFields.js, shared
	// with the admin panel (which stays Indonesian-only by design), so they
	// stay Indonesian here too regardless of the visitor's chosen language.
	let t = $derived(getDictionary(data.locale).requestEdit);

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
	<title>{t.pageTitle(data.project.title)}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="request-edit-page">
	{#if form?.success}
		<div class="admin-page-header">
			<h1>{t.thankYouTitle}</h1>
		</div>
		<p>
			{t.thankYouBefore} <strong>{data.project.title}</strong> {t.thankYouAfter}
		</p>
		<a class="btn-secondary" href="/projects/{data.project.slug}">{t.backToProject}</a>
	{:else if step === 1}
		<div class="admin-page-header">
			<h1>{t.requestEditTitle(data.project.title)}</h1>
		</div>
		<p class="dashboard-sub">{t.step1Intro}</p>
		<form class="admin-form" onsubmit={goToStep2}>
			<label>
				{t.nameLabel}
				<input type="text" bind:value={requesterName} required />
			</label>
			<label>
				{t.instagramLabel}
				<input type="text" bind:value={requesterInstagram} required placeholder={t.instagramPlaceholder} />
			</label>
			<label>
				{t.whatsappLabel}
				<input type="text" bind:value={requesterWhatsapp} />
			</label>
			<div class="form-actions">
				<button type="submit" class="btn-primary">{t.continueToEdit} <span class="btn-arrow">&rarr;</span></button>
				<a class="btn-secondary" href="/projects/{data.project.slug}">{t.cancel}</a>
			</div>
		</form>
	{:else}
		<div class="admin-page-header">
			<h1>{t.editTitle(data.project.title)}</h1>
		</div>
		<p class="dashboard-sub">
			{t.step2Intro}
		</p>
		<AdminForm
			fields={editFields}
			values={editValues}
			{errors}
			formError={form?.error}
			cancelHref="/projects/{data.project.slug}"
			submitLabel={t.submitLabel}
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
