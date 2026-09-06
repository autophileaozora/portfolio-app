<script>
	import { applyAction, deserialize } from '$app/forms';
	import { fly, fade, scale } from 'svelte/transition';
	import { uploadViaSignedUrl } from '$lib/admin/uploadViaSignedUrl.js';
	import { CATEGORY_OPTIONS, PROJECT_ROLE_OPTIONS } from '$lib/validation/schemas';
	import '$lib/styles/admin-wizard.css';

	let { form } = $props();

	/**
	 * A 6-step wizard instead of one long scroll. Every field lives in a
	 * plain `$state` variable regardless of which step is showing — the
	 * <form> never relies on native FormData collection (no `name`
	 * attributes at all), so each step's content can freely mount/unmount
	 * via {#if} with a real transition instead of being stuck with the
	 * `hidden`-attribute trick a plain form would need. Submission builds
	 * FormData by hand and posts it through the same low-level path
	 * `use:enhance` itself uses (see $app/forms' `deserialize`), so
	 * redirects/errors/field errors from +page.server.ts behave exactly as
	 * they would with a native form — the server action is untouched.
	 *
	 * Problem/Solution/Result and Dokumentasi used to be one combined
	 * "Sections" step with a type-picker per row — split into their own
	 * steps instead, since Problem/Solution/Result each have their own
	 * dedicated group (no dropdown needed to say which is which) and
	 * Dokumentasi commonly has several slides where the others usually
	 * don't.
	 */
	const STEPS = [
		{ label: 'Info Dasar', icon: 'fa-circle-info' },
		{ label: 'Kontributor', icon: 'fa-users' },
		{ label: 'Media & SEO', icon: 'fa-image' },
		{ label: 'Problem, Solution & Result', icon: 'fa-list-check' },
		{ label: 'Dokumentasi', icon: 'fa-images' },
		{ label: 'Publikasi', icon: 'fa-rocket' }
	];
	const TOTAL_STEPS = STEPS.length;
	let step = $state(1);
	let maxStepReached = $state(1);
	let direction = $state(1); // 1 = forward, -1 = backward — drives which way the step transition slides

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
			maxStepReached = Math.max(maxStepReached, target);
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
		contributors.push({ __id: crypto.randomUUID(), name: '', url: '' });
	}
	function removeContributor(i) {
		contributors.splice(i, 1);
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

	// ---- Step 4: Problem / Solution / Result ----
	// ---- Step 5: Dokumentasi ----
	// One row shape (title/content/image) shared by all four groups — only
	// which array a row lives in says what `type` it becomes at submit time.
	let problemSections = $state([]);
	let solutionSections = $state([]);
	let resultSections = $state([]);
	let documentationSections = $state([]);

	function addSectionRow(list) {
		list.push({ __id: crypto.randomUUID(), title: '', content: '', image_url: '' });
	}
	function removeSectionRow(list, i) {
		list.splice(i, 1);
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

	function toSectionRows(list, type) {
		return list.map(({ __id, __uploading, __uploadError, __preview, ...rest }) => ({ type, ...rest }));
	}
	let sectionsJson = $derived(
		JSON.stringify([
			...toSectionRows(problemSections, 'problem'),
			...toSectionRows(solutionSections, 'solution'),
			...toSectionRows(resultSections, 'result'),
			...toSectionRows(documentationSections, 'documentation')
		])
	);

	// ---- Step 6: Publikasi ----
	let is_published = $state(false);
	let is_featured = $state(false);

	let anyUploading = $derived(
		thumbnailState.uploading ||
			problemSections.some((s) => s.__uploading) ||
			solutionSections.some((s) => s.__uploading) ||
			resultSections.some((s) => s.__uploading) ||
			documentationSections.some((s) => s.__uploading)
	);
	let submitting = $state(false);
	// Separate from `form` (which SvelteKit's own action-result flow owns)
	// — this only covers the fetch() itself failing (e.g. offline).
	let networkError = $state('');

	// ---- Document import (template-based, no AI — see parseProjectDoc.ts) ----
	let showTemplateHelp = $state(false);
	let importState = $state({ uploading: false, error: '', warnings: [] });
	let importedViaDoc = $state(false);
	// Images are never extracted from the document (by design) — this stays
	// true until every image slot the import touched has been filled by
	// hand, then disappears on its own.
	let missingImages = $derived(
		importedViaDoc &&
			(!thumbnailState.url ||
				problemSections.some((s) => !s.image_url) ||
				solutionSections.some((s) => !s.image_url) ||
				resultSections.some((s) => !s.image_url) ||
				documentationSections.some((s) => !s.image_url))
	);

	const TEMPLATE_HELP_TEXT = `Format yang didukung (heading, lalu isinya di baris berikutnya):

Judul                 (di .docx: style Heading 1 / di PDF: baris "Judul")
Deskripsi
Kategori              -> web / app / design
Role
Kontributor           -> satu nama per baris, boleh + (link)
Terafiliasi
Tanggal Mulai         -> format YYYY-MM-DD
Tanggal Selesai       -> format YYYY-MM-DD
Live URL
Tags                  -> pisahkan dengan koma
Problem
Solution
Result
Dokumentasi           -> di .docx: pakai Heading 3 per slide di bawahnya
                          di PDF: semua isi jadi satu slide
SEO Meta Title        (opsional)
SEO Meta Description  (opsional)

Untuk .docx: beri baris heading itu style "Heading 1/2/3" bawaan Word,
bukan mengetik tanda #. Untuk PDF: tulis labelnya sendirian persis
seperti di atas pada barisnya sendiri (tanpa #).
Gambar (thumbnail & section) tidak ikut terisi otomatis — tetap upload
manual di step "Media & SEO" / "Problem, Solution & Result" / "Dokumentasi".`;

	function makeSectionRow(s) {
		return { __id: crypto.randomUUID(), title: s.title ?? '', content: s.content ?? '', image_url: '' };
	}

	async function onImportDocChange(e) {
		const file = e.currentTarget.files?.[0];
		if (!file) return;
		importState = { uploading: true, error: '', warnings: [] };
		try {
			const url = await uploadViaSignedUrl(file, 'imports');
			const res = await fetch('/admin/api/parse-project-doc', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ url, filename: file.name })
			});
			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				throw new Error(body.message || 'Gagal membaca dokumen.');
			}
			const { fields, warnings } = await res.json();

			title = fields.title ?? '';
			slugTouched = false; // let it re-derive from the newly-imported title
			short_description = fields.short_description ?? '';
			category = fields.category ?? '';
			role = fields.role ?? '';
			contributors = (fields.contributors ?? []).map((c) => ({
				__id: crypto.randomUUID(),
				name: c.name,
				url: c.url
			}));
			associated_with = fields.associated_with ?? '';
			date_start = fields.date_start ?? '';
			date_end = fields.date_end ?? '';
			live_url = fields.live_url ?? '';
			tags = fields.tags ?? [];
			meta_title = fields.meta_title ?? '';
			meta_description = fields.meta_description ?? '';

			const incoming = fields.sections ?? [];
			problemSections = incoming.filter((s) => s.type === 'problem').map(makeSectionRow);
			solutionSections = incoming.filter((s) => s.type === 'solution').map(makeSectionRow);
			resultSections = incoming.filter((s) => s.type === 'result').map(makeSectionRow);
			documentationSections = incoming.filter((s) => s.type === 'documentation').map(makeSectionRow);

			importedViaDoc = true;
			importState = { uploading: false, error: '', warnings };
		} catch (err) {
			importState = {
				uploading: false,
				error: err instanceof Error ? err.message : 'Gagal impor dokumen.',
				warnings: []
			};
		}
	}

	function goNext() {
		if (step < TOTAL_STEPS) {
			direction = 1;
			step += 1;
			maxStepReached = Math.max(maxStepReached, step);
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
		if (target > maxStepReached) return; // no skipping ahead of what's been reached
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

{#snippet sectionGroup(list, label)}
	<div class="wizard-section-group">
		<h3 class="wizard-section-group-title">{label}</h3>
		<div class="wizard-cards">
			{#each list as s, i (s.__id)}
				<div
					class="wizard-card"
					in:scale={{ start: 0.94, duration: 200, easing: transitionParams.easing }}
					out:fade={{ duration: 150 }}
				>
					<button
						type="button"
						class="wizard-card-remove"
						aria-label="Hapus"
						onclick={() => removeSectionRow(list, i)}
					>
						&times;
					</button>
					<input type="text" placeholder="Judul (opsional)" bind:value={s.title} />
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
						<img src={s.__preview || s.image_url} alt="Preview {label}" class="wizard-image-preview" />
					{/if}
				</div>
			{/each}
		</div>
		<button type="button" class="wizard-add-tile" onclick={() => addSectionRow(list)}>
			<i class="fa-solid fa-plus"></i> Tambah {label}
		</button>
	</div>
{/snippet}

<svelte:head>
	<title>Admin · Tambah Project</title>
</svelte:head>

<div class="admin-page-header">
	<h1>Tambah Project</h1>
</div>

<div class="wizard-progress" style="--wizard-progress-frac: {(step - 1) / (TOTAL_STEPS - 1)}">
	{#each STEPS as s, i (s.label)}
		<button
			type="button"
			class="wizard-progress-step"
			class:active={step === i + 1}
			class:done={step > i + 1}
			class:clickable={i + 1 <= maxStepReached && i + 1 !== step}
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
	{#if missingImages}
		<p class="form-warning-banner">
			⚠️ Gambar belum terisi dari dokumen (thumbnail dan/atau section) — pastikan diisi manual sebelum submit.
		</p>
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

				<div class="wizard-import-box">
					<div class="wizard-import-header">
						<i class="fa-solid fa-file-import"></i>
						<span>Isi Otomatis dari Dokumen (opsional)</span>
					</div>
					<p class="wizard-step-sub">
						Upload .docx atau PDF yang mengikuti format heading baku —
						<button type="button" class="wizard-link-btn" onclick={() => (showTemplateHelp = !showTemplateHelp)}>
							{showTemplateHelp ? 'sembunyikan formatnya' : 'lihat formatnya'}
						</button>.
					</p>
					{#if showTemplateHelp}
						<pre class="wizard-template-help">{TEMPLATE_HELP_TEXT}</pre>
					{/if}
					<input type="file" accept=".docx,.pdf" onchange={onImportDocChange} />
					{#if importState.uploading}
						<span class="upload-status">Membaca dokumen...</span>
					{:else if importState.error}
						<span class="field-error">{importState.error}</span>
					{:else if importedViaDoc}
						<span class="upload-status">✓ Konten berhasil diisi dari dokumen.</span>
					{/if}
					{#if importState.warnings.length}
						<ul class="wizard-import-warnings">
							{#each importState.warnings as w (w)}
								<li>{w}</li>
							{/each}
						</ul>
					{/if}
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
					<h2 class="wizard-step-title">Problem, Solution & Result</h2>
				</div>
				<p class="wizard-step-sub">Opsional — masing-masing biasanya satu, tapi boleh lebih dari satu.</p>
				{@render sectionGroup(problemSections, 'Problem')}
				{@render sectionGroup(solutionSections, 'Solution')}
				{@render sectionGroup(resultSections, 'Result')}
			{:else if step === 5}
				<div class="wizard-step-header">
					<span class="wizard-step-icon"><i class="fa-solid {STEPS[4].icon}"></i></span>
					<h2 class="wizard-step-title">Dokumentasi</h2>
				</div>
				<p class="wizard-step-sub">Opsional — bisa lebih dari satu slide, ditampilkan sebagai carousel.</p>
				{@render sectionGroup(documentationSections, 'Slide Dokumentasi')}
			{:else if step === 6}
				<div class="wizard-step-header">
					<span class="wizard-step-icon"><i class="fa-solid {STEPS[5].icon}"></i></span>
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
					Tambah Project
				{/if}
			</button>
		{/if}
	</div>
</form>
