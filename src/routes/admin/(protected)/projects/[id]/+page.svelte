<script>
	import { applyAction, deserialize } from '$app/forms';
	import { fly, fade, scale } from 'svelte/transition';
	import { uploadViaSignedUrl } from '$lib/admin/uploadViaSignedUrl.js';
	import { CATEGORY_OPTIONS, PROJECT_ROLE_OPTIONS, SECTION_TYPES } from '$lib/validation/schemas';
	import { SECTION_TYPE_LABELS } from '$lib/admin/projectFields.js';
	import '$lib/styles/admin-wizard.css';

	let { data, form } = $props();

	/**
	 * Same 5-step wizard as admin/projects/new, seeded from the existing
	 * project instead of blank — including its sections, so "Kelola
	 * Sections" as a separate page is no longer needed for the common
	 * case. See that file for the full rationale on the FormData-by-hand
	 * submission approach (lets each step use a real transition instead
	 * of the `hidden`-attribute trick a native form would need).
	 */
	const STEPS = [
		{ label: 'Info Dasar', icon: 'fa-circle-info' },
		{ label: 'Kontributor', icon: 'fa-users' },
		{ label: 'Media & SEO', icon: 'fa-image' },
		{ label: 'Sections', icon: 'fa-layer-group' },
		{ label: 'Publikasi', icon: 'fa-rocket' }
	];
	const TOTAL_STEPS = STEPS.length;
	let step = $state(1);
	let maxStepReached = $state(TOTAL_STEPS); // editing an existing project — every step already has data, so every dot is clickable from the start
	let direction = $state(1);

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
			const target = Math.min(...Object.keys(errs).map((k) => FIELD_STEP[k] ?? 1));
			direction = target < step ? -1 : 1;
			step = target;
		}
	});

	// ---- Step 1: Info Dasar ----
	let title = $state(data.project.title ?? '');
	let slug = $state(data.project.slug ?? '');
	// The slug already exists and is presumably intentional (it's the
	// project's URL) — unlike the new-project wizard, editing the title
	// here must NOT silently regenerate it.
	let slugTouched = $state(true);
	let short_description = $state(data.project.short_description ?? '');
	let category = $state(data.project.category ?? '');
	let role = $state(data.project.role ?? '');

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
	let contributors = $state(
		(data.project.contributors_list ?? []).map((c) => ({
			__id: crypto.randomUUID(),
			name: c.name ?? '',
			url: c.url ?? ''
		}))
	);
	function addContributor() {
		contributors = [...contributors, { __id: crypto.randomUUID(), name: '', url: '' }];
	}
	function removeContributor(i) {
		contributors = contributors.filter((_, idx) => idx !== i);
	}
	let contributorsJson = $derived(JSON.stringify(contributors.map(({ __id, ...rest }) => rest)));

	// ---- Step 3: Media, Tautan, Tags & SEO ----
	let associated_with = $state(data.project.associated_with ?? '');
	let date_start = $state(data.project.date_start ?? '');
	let date_end = $state(data.project.date_end ?? '');
	let live_url = $state(data.project.live_url ?? '');
	let meta_title = $state(data.project.meta_title ?? '');
	let meta_description = $state(data.project.meta_description ?? '');

	let thumbnailState = $state({ uploading: false, error: '', url: data.project.thumbnail_url ?? '', preview: '' });
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

	let tags = $state(
		(data.tagsText ?? '')
			.split(',')
			.map((t) => t.trim())
			.filter(Boolean)
	);
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
	let sections = $state(
		(data.sections ?? []).map((s) => ({
			__id: crypto.randomUUID(),
			type: s.type,
			title: s.title ?? '',
			content: s.content ?? '',
			image_url: s.image_url ?? ''
		}))
	);
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
	let is_published = $state(!!data.project.is_published);
	let is_featured = $state(!!data.project.is_featured);

	let anyUploading = $derived(thumbnailState.uploading || sections.some((s) => s.__uploading));
	let submitting = $state(false);
	let networkError = $state('');

	function goNext() {
		if (step < TOTAL_STEPS) {
			direction = 1;
			step += 1;
		}
	}
	function goBack() {
		if (step > 1) {
			direction = -1;
			step -= 1;
		}
	}
	function jumpTo(i) {
		const target = i + 1;
		if (target === step) return;
		direction = target < step ? -1 : 1;
		step = target;
	}

	async function handleSubmit(e) {
		e.preventDefault();
		submitting = true;
		networkError = '';

		const fd = new FormData();
		fd.set('title', title);
		fd.set('slug', slug);
		fd.set('short_description', short_description);
		fd.set('category', category);
		fd.set('role', role);
		fd.set('contributors_list', contributorsJson);
		fd.set('associated_with', associated_with);
		fd.set('date_start', date_start);
		fd.set('date_end', date_end);
		fd.set('live_url', live_url);
		fd.set('thumbnail_url', thumbnailState.url);
		fd.set('tags', tagsText);
		fd.set('meta_title', meta_title);
		fd.set('meta_description', meta_description);
		fd.set('sections', sectionsJson);
		if (is_published) fd.set('is_published', 'on');
		if (is_featured) fd.set('is_featured', 'on');

		try {
			const response = await fetch(location.pathname, {
				method: 'POST',
				headers: { accept: 'application/json', 'x-sveltekit-action': 'true' },
				body: fd
			});
			const result = deserialize(await response.text());
			await applyAction(result);
		} catch {
			networkError = 'Gagal terhubung ke server. Coba lagi.';
		} finally {
			submitting = false;
		}
	}

	const transitionParams = { duration: 260, easing: (t) => 1 - Math.pow(1 - t, 3) };
</script>

<svelte:head>
	<title>Admin · Edit Project</title>
</svelte:head>

<div class="admin-page-header">
	<h1>Edit Project</h1>
</div>

{#if data.pendingEditRequestCount > 0}
	<p
		class="form-success-banner"
		style="border-color: rgba(108,99,255,0.35); background: rgba(108,99,255,0.08); color: #4b3fd6;"
	>
		Ada {data.pendingEditRequestCount} permintaan edit dari publik untuk project ini yang menunggu review —
		<a href="/admin/edit-requests">lihat di sini</a>.
	</p>
{/if}

<div class="wizard-progress" style="--wizard-progress-frac: {(step - 1) / (TOTAL_STEPS - 1)}">
	{#each STEPS as s, i (s.label)}
		<button
			type="button"
			class="wizard-progress-step"
			class:active={step === i + 1}
			class:done={step > i + 1}
			class:clickable={i + 1 !== step}
			onclick={() => jumpTo(i)}
		>
			<span class="wizard-progress-dot">
				{#if step > i + 1}
					<i class="fa-solid fa-check"></i>
				{:else}
					{i + 1}
				{/if}
			</span>
			<span class="wizard-progress-label">{s.label}</span>
		</button>
	{/each}
</div>

<form class="admin-form wizard-form" onsubmit={handleSubmit}>
	{#if form?.error || networkError}
		<p class="form-error-banner">{form?.error || networkError}</p>
	{/if}

	{#key step}
		<div
			class="wizard-step-panel"
			in:fly={{ x: direction * 24, duration: transitionParams.duration, easing: transitionParams.easing }}
			out:fade={{ duration: 120 }}
		>
			{#if step === 1}
				<div class="wizard-step-header">
					<span class="wizard-step-icon"><i class="fa-solid {STEPS[0].icon}"></i></span>
					<h2 class="wizard-step-title">Info Dasar</h2>
				</div>
				<label>
					Judul
					<input type="text" bind:value={title} />
					{#if form?.fieldErrors?.title}<span class="field-error">{form.fieldErrors.title[0]}</span>{/if}
				</label>
				<label>
					Slug (URL)
					<input type="text" bind:value={slug} oninput={() => (slugTouched = true)} />
					{#if form?.fieldErrors?.slug}<span class="field-error">{form.fieldErrors.slug[0]}</span>{/if}
				</label>
				<label>
					Deskripsi singkat
					<textarea bind:value={short_description}></textarea>
				</label>
				<label>
					Kategori
					<select bind:value={category}>
						<option value="">—</option>
						{#each CATEGORY_OPTIONS as opt (opt)}<option value={opt}>{opt}</option>{/each}
					</select>
				</label>
				<label>
					Role
					<input type="text" list="role-datalist" bind:value={role} autocomplete="off" />
					<datalist id="role-datalist">
						{#each PROJECT_ROLE_OPTIONS as opt (opt)}<option value={opt}></option>{/each}
					</datalist>
				</label>
			{:else if step === 2}
				<div class="wizard-step-header">
					<span class="wizard-step-icon"><i class="fa-solid {STEPS[1].icon}"></i></span>
					<h2 class="wizard-step-title">Kontributor</h2>
				</div>
				<p class="wizard-step-sub">Opsional — bisa lebih dari satu, masing-masing dengan link ke sosial media.</p>
				<div class="wizard-cards">
					{#each contributors as c, i (c.__id)}
						<div
							class="wizard-card"
							in:scale={{ start: 0.94, duration: 200, easing: transitionParams.easing }}
							out:fade={{ duration: 150 }}
						>
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
					{/each}
				</div>
				<button type="button" class="wizard-add-tile" onclick={addContributor}>
					<i class="fa-solid fa-plus"></i> Tambah Kontributor
				</button>
			{:else if step === 3}
				<div class="wizard-step-header">
					<span class="wizard-step-icon"><i class="fa-solid {STEPS[2].icon}"></i></span>
					<h2 class="wizard-step-title">Media, Tautan & SEO</h2>
				</div>
				<label>
					Thumbnail
					<div class="wizard-file-row">
						<input type="file" accept="image/*" onchange={onThumbnailChange} />
						{#if thumbnailState.uploading}
							<span class="upload-status">Mengunggah...</span>
						{:else if thumbnailState.error}
							<span class="field-error">{thumbnailState.error}</span>
						{/if}
					</div>
				</label>
				{#if thumbnailState.preview || thumbnailState.url}
					<img
						src={thumbnailState.preview || thumbnailState.url}
						alt="Preview thumbnail"
						class="wizard-image-preview"
					/>
				{/if}

				<label>
					Terafiliasi dengan
					<input type="text" bind:value={associated_with} />
				</label>
				<label>
					Tanggal mulai
					<input type="date" bind:value={date_start} />
				</label>
				<label>
					Tanggal selesai
					<input type="date" bind:value={date_end} />
				</label>
				<label>
					Live URL
					<input type="text" bind:value={live_url} />
				</label>
				<label>
					Tags
					<div class="tag-chip-box">
						{#each tags as tag, i (tag)}
							<span class="tag-chip" transition:scale={{ start: 0.8, duration: 150 }}>
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
				<label>
					SEO: Meta title (kosongkan untuk pakai Judul)
					<input type="text" bind:value={meta_title} />
				</label>
				<label>
					SEO: Meta description (kosongkan untuk pakai Deskripsi singkat)
					<textarea bind:value={meta_description}></textarea>
				</label>
			{:else if step === 4}
				<div class="wizard-step-header">
					<span class="wizard-step-icon"><i class="fa-solid {STEPS[3].icon}"></i></span>
					<h2 class="wizard-step-title">Sections</h2>
				</div>
				<p class="wizard-step-sub">Problem / Solution / Result / Dokumentasi — opsional.</p>
				<div class="wizard-cards">
					{#each sections as s, i (s.__id)}
						<div
							class="wizard-card"
							in:scale={{ start: 0.94, duration: 200, easing: transitionParams.easing }}
							out:fade={{ duration: 150 }}
						>
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
							<div class="wizard-file-row">
								<input type="file" accept="image/*" onchange={(e) => onSectionFileChange(s, e)} />
								{#if s.__uploading}
									<span class="upload-status">Mengunggah...</span>
								{:else if s.__uploadError}
									<span class="field-error">{s.__uploadError}</span>
								{/if}
							</div>
							{#if s.__preview || s.image_url}
								<img src={s.__preview || s.image_url} alt="Preview section" class="wizard-image-preview" />
							{/if}
						</div>
					{/each}
				</div>
				<button type="button" class="wizard-add-tile" onclick={addSection}>
					<i class="fa-solid fa-plus"></i> Tambah Section
				</button>
			{:else if step === 5}
				<div class="wizard-step-header">
					<span class="wizard-step-icon"><i class="fa-solid {STEPS[4].icon}"></i></span>
					<h2 class="wizard-step-title">Publikasi</h2>
				</div>
				<label class="checkbox-label">
					<input type="checkbox" bind:checked={is_published} />
					Terbitkan di halaman publik
				</label>
				<label class="checkbox-label">
					<input type="checkbox" bind:checked={is_featured} />
					Tampilkan sebagai unggulan di Home
				</label>
			{/if}
		</div>
	{/key}

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
					Simpan
				{/if}
			</button>
		{/if}
	</div>
</form>
