<script>
	import { enhance } from '$app/forms';
	import { uploadViaSignedUrl } from '$lib/admin/uploadViaSignedUrl.js';
	import { CATEGORY_OPTIONS, PROJECT_ROLE_OPTIONS, SECTION_TYPES } from '$lib/validation/schemas';
	import { SECTION_TYPE_LABELS } from '$lib/admin/projectFields.js';
	import '$lib/styles/admin-wizard.css';

	let { form } = $props();

	/**
	 * A 5-step wizard instead of one long scroll. Every field still lives in
	 * ONE <form> that submits once at the end — steps are shown/hidden with
	 * the `hidden` attribute (not {#if}), which only toggles CSS display and
	 * never unmounts the inputs, so values from earlier steps are still part
	 * of the FormData when the final step submits. The +page.server.ts
	 * action is untouched: it reads the exact same field names it always
	 * has, so this is a front-end-only rewrite of the old single-page form.
	 */
	const STEP_LABELS = ['Info Dasar', 'Kontributor', 'Media & SEO', 'Sections', 'Publikasi'];
	const TOTAL_STEPS = STEP_LABELS.length;
	let step = $state(1);

	// If the action fails validation, jump back to the earliest step that
	// has an error so it's not hidden out of view.
	const FIELD_STEP = {
		title: 1,
		slug: 1,
		short_description: 1,
		category: 1,
		role: 1,
		contributors_list: 2,
		associated_with: 3,
		date_start: 3,
		date_end: 3,
		live_url: 3,
		thumbnail_url: 3,
		tags: 3,
		meta_title: 3,
		meta_description: 3
	};
	$effect(() => {
		const errs = form?.fieldErrors;
		if (errs && Object.keys(errs).length) {
			step = Math.min(...Object.keys(errs).map((k) => FIELD_STEP[k] ?? 1));
		}
	});

	// ---- Step 1: Info Dasar ----
	let title = $state('');
	let slug = $state('');
	let slugTouched = $state(false);
	let short_description = $state('');
	let category = $state('');
	let role = $state('');

	function slugify(str) {
		return str
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '');
	}
	$effect(() => {
		if (!slugTouched) slug = slugify(title);
	});

	let step1Valid = $derived(title.trim().length > 0 && slug.trim().length > 0);

	// ---- Step 2: Kontributor ----
	let contributors = $state([]);
	function addContributor() {
		contributors = [...contributors, { __id: crypto.randomUUID(), name: '', url: '' }];
	}
	function removeContributor(i) {
		contributors = contributors.filter((_, idx) => idx !== i);
	}
	let contributorsJson = $derived(JSON.stringify(contributors.map(({ __id, ...rest }) => rest)));

	// ---- Step 3: Media, Tautan, Tags & SEO ----
	let associated_with = $state('');
	let date_start = $state('');
	let date_end = $state('');
	let live_url = $state('');
	let meta_title = $state('');
	let meta_description = $state('');

	let thumbnailState = $state({ uploading: false, error: '', url: '', preview: '' });
	async function onThumbnailChange(e) {
		const file = e.currentTarget.files?.[0];
		if (!file) return;
		thumbnailState.preview = URL.createObjectURL(file);
		thumbnailState.uploading = true;
		thumbnailState.error = '';
		try {
			thumbnailState.url = await uploadViaSignedUrl(file, 'thumbnails');
		} catch (err) {
			thumbnailState.error = err instanceof Error ? err.message : 'Upload gagal.';
		} finally {
			thumbnailState.uploading = false;
		}
	}

	let tags = $state([]);
	let tagInput = $state('');
	function commitTag() {
		const t = tagInput.trim();
		if (t && !tags.includes(t)) tags = [...tags, t];
		tagInput = '';
	}
	function onTagKeydown(e) {
		if (e.key === 'Enter' || e.key === ',') {
			e.preventDefault();
			commitTag();
		} else if (e.key === 'Backspace' && !tagInput && tags.length) {
			tags = tags.slice(0, -1);
		}
	}
	function removeTag(i) {
		tags = tags.filter((_, idx) => idx !== i);
	}
	let tagsText = $derived(tags.join(', '));

	// ---- Step 4: Sections ----
	let sections = $state([]);
	function addSection() {
		sections = [
			...sections,
			{ __id: crypto.randomUUID(), type: SECTION_TYPES[0], title: '', content: '', image_url: '' }
		];
	}
	function removeSection(i) {
		sections = sections.filter((_, idx) => idx !== i);
	}
	async function onSectionFileChange(row, e) {
		const file = e.currentTarget.files?.[0];
		if (!file) return;
		row.__preview = URL.createObjectURL(file);
		row.__uploading = true;
		row.__uploadError = '';
		try {
			row.image_url = await uploadViaSignedUrl(file, 'sections');
		} catch (err) {
			row.__uploadError = err instanceof Error ? err.message : 'Upload gagal.';
		} finally {
			row.__uploading = false;
		}
	}
	let sectionsJson = $derived(
		JSON.stringify(sections.map(({ __id, __uploading, __uploadError, __preview, ...rest }) => rest))
	);

	// ---- Step 5: Publikasi ----
	let is_published = $state(false);
	let is_featured = $state(false);

	let anyUploading = $derived(thumbnailState.uploading || sections.some((s) => s.__uploading));
	let submitting = $state(false);

	function goNext() {
		step = Math.min(TOTAL_STEPS, step + 1);
	}
	function goBack() {
		step = Math.max(1, step - 1);
	}
</script>

<svelte:head>
	<title>Admin · Tambah Project</title>
</svelte:head>

<div class="admin-page-header">
	<h1>Tambah Project</h1>
</div>

<div class="wizard-progress">
	{#each STEP_LABELS as label, i (label)}
		<div class="wizard-progress-step" class:active={step === i + 1} class:done={step > i + 1}>
			<div class="wizard-progress-dot">{i + 1}</div>
			<span class="wizard-progress-label">{label}</span>
		</div>
	{/each}
</div>

<form
	method="POST"
	class="admin-form wizard-form"
	use:enhance={() => {
		submitting = true;
		return async ({ update }) => {
			await update();
			submitting = false;
		};
	}}
>
	{#if form?.error}
		<p class="form-error-banner">{form.error}</p>
	{/if}

	<section hidden={step !== 1}>
		<h2 class="wizard-step-title">Info Dasar</h2>
		<label>
			Judul
			<input type="text" name="title" bind:value={title} />
			{#if form?.fieldErrors?.title}<span class="field-error">{form.fieldErrors.title[0]}</span>{/if}
		</label>
		<label>
			Slug (URL)
			<input type="text" name="slug" bind:value={slug} oninput={() => (slugTouched = true)} />
			{#if form?.fieldErrors?.slug}<span class="field-error">{form.fieldErrors.slug[0]}</span>{/if}
		</label>
		<label>
			Deskripsi singkat
			<textarea name="short_description" bind:value={short_description}></textarea>
		</label>
		<label>
			Kategori
			<select name="category" bind:value={category}>
				<option value="">—</option>
				{#each CATEGORY_OPTIONS as opt (opt)}<option value={opt}>{opt}</option>{/each}
			</select>
		</label>
		<label>
			Role
			<input type="text" name="role" list="role-datalist" bind:value={role} autocomplete="off" />
			<datalist id="role-datalist">
				{#each PROJECT_ROLE_OPTIONS as opt (opt)}<option value={opt}></option>{/each}
			</datalist>
		</label>
	</section>

	<section hidden={step !== 2}>
		<h2 class="wizard-step-title">Kontributor</h2>
		<p class="wizard-step-sub">Opsional — bisa lebih dari satu, masing-masing dengan link ke sosial media.</p>
		<div class="wizard-cards">
			{#each contributors as c, i (c.__id)}
				<div class="wizard-card">
					<button
						type="button"
						class="wizard-card-remove"
						aria-label="Hapus"
						onclick={() => removeContributor(i)}
					>
						&times;
					</button>
					<div class="wizard-card-row">
						<input type="text" placeholder="Nama" bind:value={c.name} />
						<input type="text" placeholder="Link sosial media (opsional)" bind:value={c.url} />
					</div>
				</div>
			{:else}
				<p class="repeater-empty">Belum ada kontributor.</p>
			{/each}
		</div>
		<button type="button" class="btn-secondary repeater-add" onclick={addContributor}>
			+ Tambah Kontributor
		</button>
		<input type="hidden" name="contributors_list" value={contributorsJson} />
	</section>

	<section hidden={step !== 3}>
		<h2 class="wizard-step-title">Media, Tautan & SEO</h2>
		<label>
			Thumbnail
			<input type="file" accept="image/*" onchange={onThumbnailChange} />
		</label>
		<input type="hidden" name="thumbnail_url" value={thumbnailState.url} />
		{#if thumbnailState.uploading}
			<span class="upload-status">Mengunggah...</span>
		{:else if thumbnailState.error}
			<span class="field-error">{thumbnailState.error}</span>
		{/if}
		{#if thumbnailState.preview || thumbnailState.url}
			<img src={thumbnailState.preview || thumbnailState.url} alt="Preview thumbnail" class="wizard-image-preview" />
		{/if}

		<label>
			Terafiliasi dengan
			<input type="text" name="associated_with" bind:value={associated_with} />
		</label>
		<label>
			Tanggal mulai
			<input type="date" name="date_start" bind:value={date_start} />
		</label>
		<label>
			Tanggal selesai
			<input type="date" name="date_end" bind:value={date_end} />
		</label>
		<label>
			Live URL
			<input type="text" name="live_url" bind:value={live_url} />
		</label>
		<label>
			Tags
			<div class="tag-chip-box">
				{#each tags as tag, i (tag)}
					<span class="tag-chip">
						{tag}
						<button type="button" aria-label="Hapus tag" onclick={() => removeTag(i)}>&times;</button>
					</span>
				{/each}
				<input
					type="text"
					placeholder="Ketik lalu Enter"
					bind:value={tagInput}
					onkeydown={onTagKeydown}
					onblur={commitTag}
				/>
			</div>
		</label>
		<input type="hidden" name="tags" value={tagsText} />
		<label>
			SEO: Meta title (kosongkan untuk pakai Judul)
			<input type="text" name="meta_title" bind:value={meta_title} />
		</label>
		<label>
			SEO: Meta description (kosongkan untuk pakai Deskripsi singkat)
			<textarea name="meta_description" bind:value={meta_description}></textarea>
		</label>
	</section>

	<section hidden={step !== 4}>
		<h2 class="wizard-step-title">Sections</h2>
		<p class="wizard-step-sub">
			Problem / Solution / Result / Dokumentasi — opsional, bisa juga ditambah belakangan lewat "Kelola Sections".
		</p>
		<div class="wizard-cards">
			{#each sections as s, i (s.__id)}
				<div class="wizard-card">
					<button type="button" class="wizard-card-remove" aria-label="Hapus" onclick={() => removeSection(i)}>
						&times;
					</button>
					<div class="wizard-card-row">
						<select bind:value={s.type}>
							{#each SECTION_TYPES as t (t)}<option value={t}>{SECTION_TYPE_LABELS[t]}</option>{/each}
						</select>
						<input type="text" placeholder="Judul" bind:value={s.title} />
					</div>
					<textarea placeholder="Konten" bind:value={s.content}></textarea>
					<input type="file" accept="image/*" onchange={(e) => onSectionFileChange(s, e)} />
					{#if s.__uploading}
						<span class="upload-status">Mengunggah...</span>
					{:else if s.__uploadError}
						<span class="field-error">{s.__uploadError}</span>
					{/if}
					{#if s.__preview || s.image_url}
						<img src={s.__preview || s.image_url} alt="Preview section" class="wizard-image-preview" />
					{/if}
				</div>
			{:else}
				<p class="repeater-empty">Belum ada section.</p>
			{/each}
		</div>
		<button type="button" class="btn-secondary repeater-add" onclick={addSection}>+ Tambah Section</button>
		<input type="hidden" name="sections" value={sectionsJson} />
	</section>

	<section hidden={step !== 5}>
		<h2 class="wizard-step-title">Publikasi</h2>
		<label class="checkbox-label">
			<input type="checkbox" name="is_published" bind:checked={is_published} />
			Terbitkan di halaman publik
		</label>
		<label class="checkbox-label">
			<input type="checkbox" name="is_featured" bind:checked={is_featured} />
			Tampilkan sebagai unggulan di Home
		</label>
	</section>

	<div class="wizard-nav">
		{#if step > 1}
			<button type="button" class="btn-secondary" onclick={goBack}>&larr; Kembali</button>
		{:else}
			<a class="btn-secondary" href="/admin/projects">Batal</a>
		{/if}

		{#if step < TOTAL_STEPS}
			<button type="button" class="btn-primary" onclick={goNext} disabled={step === 1 && !step1Valid}>
				Lanjut &rarr;
			</button>
		{:else}
			<button type="submit" class="btn-primary" disabled={submitting || anyUploading}>
				{#if anyUploading}
					Menunggu upload selesai...
				{:else if submitting}
					Menyimpan...
				{:else}
					Tambah Project
				{/if}
			</button>
		{/if}
	</div>
</form>
