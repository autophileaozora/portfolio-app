<script>
	import { enhance } from '$app/forms';
	import { PUBLIC_SUPABASE_PUBLISHABLE_KEY } from '$env/static/public';

	/**
	 * fields: [{
	 *   name, label, required, default,
	 *   type: 'text'|'number'|'textarea'|'date'|'checkbox'|'select'|'searchable-select'|'file'|'hidden'|'repeater',
	 *   options,    // 'select'/'searchable-select': [{ value, label }] or plain strings —
	 *               // 'searchable-select' is a <datalist>-backed input: options are
	 *               // suggestions, not a hard constraint (typing anything else is
	 *               // still accepted), for lists expected to grow over time.
	 *   accept,     // 'file' only: <input accept=""> filter, e.g. 'image/*'
	 *   isImage,    // 'file' only: preview as <img> instead of a plain link
	 *   folder,     // 'file' only: which Supabase Storage folder to upload into
	 *               // (see the upload-url endpoint's ALLOWED_FOLDERS)
	 *   value,      // 'hidden' only: fixed value, not sourced from `values`
	 *   itemFields  // 'repeater' only: [{ name, label, type?, options?, accept?, folder? }]
	 *               // — one input per sub-field per row, defaulting to a plain
	 *               // text input; itemField.type 'select' renders a dropdown
	 *               // (itemField.options, same shape as a top-level select),
	 *               // itemField.type 'file' renders a per-row file input whose
	 *               // *uploaded URL* (not the file itself) becomes row[itemField.name].
	 * }]
	 * values/errors come from the +page.server.ts load (values) and form action
	 * fail() payload (errors), keyed by field name.
	 *
	 * File fields never actually submit a file to the form action. Vercel's
	 * Serverless Functions cap request bodies at 4.5MB — fine for one small
	 * photo, but easy to blow past with a real thumbnail plus several section
	 * images in one submission. So the moment a file is chosen, it's uploaded
	 * straight to Supabase Storage via a signed URL (see the upload-url
	 * endpoint), and only the resulting public URL — a plain string — ends up
	 * in the field that actually gets submitted. The <input type="file"> itself
	 * is never given a `name`, so it's inert as far as the form POST goes.
	 */
	let {
		fields,
		values = {},
		errors = {},
		formError = '',
		successMessage = '',
		cancelHref,
		submitLabel = 'Simpan'
	} = $props();

	let submitting = $state(false);

	function optionValue(opt) {
		return typeof opt === 'string' ? opt : opt.value;
	}
	function optionLabel(opt) {
		return typeof opt === 'string' ? opt : opt.label;
	}

	// ---- direct-to-storage upload ----
	async function uploadViaSignedUrl(file, folder) {
		const res = await fetch('/admin/api/upload-url', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ folder, filename: file.name })
		});
		if (!res.ok) throw new Error('Gagal menyiapkan upload.');
		const { signedUrl, publicUrl } = await res.json();

		const putRes = await fetch(signedUrl, {
			method: 'PUT',
			headers: {
				apikey: PUBLIC_SUPABASE_PUBLISHABLE_KEY,
				authorization: `Bearer ${PUBLIC_SUPABASE_PUBLISHABLE_KEY}`,
				'content-type': file.type || 'application/octet-stream',
				'x-upsert': 'true'
			},
			body: file
		});
		if (!putRes.ok) throw new Error('Gagal mengunggah file.');
		return publicUrl;
	}

	// ---- top-level file field state ----
	let fileState = $state(
		Object.fromEntries(
			fields
				.filter((f) => f.type === 'file')
				.map((f) => [f.name, { uploading: false, error: '', url: values[f.name] ?? '' }])
		)
	);

	async function onTopLevelFileChange(field, e) {
		const file = e.currentTarget.files?.[0];
		if (!file) return;
		fileState[field.name] = { ...fileState[field.name], uploading: true, error: '' };
		try {
			const url = await uploadViaSignedUrl(file, field.folder);
			fileState[field.name] = { uploading: false, error: '', url };
		} catch (err) {
			fileState[field.name] = {
				...fileState[field.name],
				uploading: false,
				error: err instanceof Error ? err.message : 'Upload gagal.'
			};
		}
	}

	// ---- repeater state ----
	// Keyed by field name; each row gets a client-only __id so #each can key
	// on something stable even before/without a real identity from the DB.
	function parseRepeaterValue(raw) {
		const arr = typeof raw === 'string' ? safeJsonParse(raw) : Array.isArray(raw) ? raw : [];
		return arr.map((row) => {
			const { _rowId, ...rest } = row;
			return { ...rest, __id: _rowId || crypto.randomUUID() };
		});
	}
	function safeJsonParse(str) {
		try {
			const parsed = JSON.parse(str);
			return Array.isArray(parsed) ? parsed : [];
		} catch {
			return [];
		}
	}

	let repeaterRows = $state(
		Object.fromEntries(
			fields.filter((f) => f.type === 'repeater').map((f) => [f.name, parseRepeaterValue(values[f.name])])
		)
	);

	function addRepeaterRow(field) {
		const blankRow = Object.fromEntries(
			field.itemFields
				.filter((f) => f.type !== 'file')
				.map((f) => [f.name, f.type === 'select' && f.options?.length ? optionValue(f.options[0]) : ''])
		);
		repeaterRows[field.name] = [...repeaterRows[field.name], { ...blankRow, __id: crypto.randomUUID() }];
	}
	function removeRepeaterRow(fieldName, index) {
		repeaterRows[fieldName] = repeaterRows[fieldName].filter((_, i) => i !== index);
	}
	function repeaterJson(fieldName) {
		return JSON.stringify(
			repeaterRows[fieldName].map(({ __id, __uploading, __uploadError, ...rest }) => ({ ...rest, _rowId: __id }))
		);
	}
	async function onRepeaterFileChange(row, itemField, e) {
		const file = e.currentTarget.files?.[0];
		if (!file) return;
		row.__uploading = true;
		row.__uploadError = '';
		try {
			row[itemField.name] = await uploadViaSignedUrl(file, itemField.folder);
		} catch (err) {
			row.__uploadError = err instanceof Error ? err.message : 'Upload gagal.';
		} finally {
			row.__uploading = false;
		}
	}

	let anyUploading = $derived(
		Object.values(fileState).some((s) => s.uploading) ||
			Object.values(repeaterRows).some((rows) => rows.some((r) => r.__uploading))
	);
</script>

<form
	class="admin-form"
	method="POST"
	use:enhance={() => {
		submitting = true;
		return async ({ update }) => {
			await update();
			submitting = false;
		};
	}}
>
	{#if formError}
		<p class="form-error-banner">{formError}</p>
	{:else if successMessage}
		<p class="form-success-banner">{successMessage}</p>
	{/if}

	{#each fields as field (field.name)}
		{#if field.type === 'hidden'}
			<input type="hidden" name={field.name} value={field.value} />
		{:else if field.type === 'checkbox'}
			<label class="checkbox-label">
				<input type="checkbox" name={field.name} checked={values[field.name] ?? field.default ?? false} />
				{field.label}
			</label>
		{:else if field.type === 'repeater'}
			<div class="repeater-field">
				<span class="repeater-label">{field.label}</span>
				{#each repeaterRows[field.name] as row, i (row.__id)}
					<div class="repeater-row">
						{#each field.itemFields as itemField (itemField.name)}
							{#if itemField.type === 'select'}
								<select bind:value={row[itemField.name]}>
									{#each itemField.options as opt (optionValue(opt))}
										<option value={optionValue(opt)}>{optionLabel(opt)}</option>
									{/each}
								</select>
							{:else if itemField.type === 'file'}
								<span class="repeater-file-field">
									<span class="repeater-file-label">{itemField.label}</span>
									<input
										type="file"
										accept={itemField.accept}
										onchange={(e) => onRepeaterFileChange(row, itemField, e)}
									/>
									{#if row.__uploading}
										<span class="upload-status">Mengunggah...</span>
									{:else if row.__uploadError}
										<span class="field-error">{row.__uploadError}</span>
									{:else if row[itemField.name]}
										<span class="upload-status">✓ Terunggah</span>
									{/if}
								</span>
							{:else}
								<input type="text" placeholder={itemField.label} bind:value={row[itemField.name]} />
							{/if}
						{/each}
						<button
							type="button"
							class="repeater-remove"
							aria-label="Hapus baris"
							onclick={() => removeRepeaterRow(field.name, i)}
						>
							&times;
						</button>
					</div>
				{:else}
					<p class="repeater-empty">Belum ada.</p>
				{/each}
				<button type="button" class="btn-secondary repeater-add" onclick={() => addRepeaterRow(field)}>
					+ Tambah {field.label}
				</button>
				<input type="hidden" name={field.name} value={repeaterJson(field.name)} />
				{#if errors[field.name]}
					<span class="field-error">{errors[field.name]}</span>
				{/if}
			</div>
		{:else}
			<label>
				{field.label}
				{#if field.type === 'number'}
					<input
						type="number"
						name={field.name}
						value={values[field.name] ?? field.default ?? 0}
						required={field.required}
					/>
				{:else if field.type === 'date'}
					<input type="date" name={field.name} value={values[field.name] ?? ''} required={field.required} />
				{:else if field.type === 'textarea'}
					<textarea name={field.name} required={field.required}>{values[field.name] ?? ''}</textarea>
				{:else if field.type === 'select'}
					<select name={field.name} required={field.required}>
						{#if !field.required}
							<option value="">—</option>
						{/if}
						{#each field.options as opt (optionValue(opt))}
							<option value={optionValue(opt)} selected={values[field.name] === optionValue(opt)}>
								{optionLabel(opt)}
							</option>
						{/each}
					</select>
				{:else if field.type === 'searchable-select'}
					<input
						type="text"
						name={field.name}
						list="{field.name}-datalist"
						value={values[field.name] ?? ''}
						required={field.required}
						autocomplete="off"
					/>
					<datalist id="{field.name}-datalist">
						{#each field.options as opt (optionValue(opt))}
							<option value={optionValue(opt)}>{optionLabel(opt)}</option>
						{/each}
					</datalist>
				{:else if field.type === 'file'}
					<input type="file" accept={field.accept} onchange={(e) => onTopLevelFileChange(field, e)} />
					<input type="hidden" name={field.name} value={fileState[field.name]?.url ?? ''} />
					{#if fileState[field.name]?.uploading}
						<span class="upload-status">Mengunggah...</span>
					{:else if fileState[field.name]?.error}
						<span class="field-error">{fileState[field.name].error}</span>
					{/if}
					{#if fileState[field.name]?.url}
						<div class="current-file-preview">
							{#if field.isImage}
								<img src={fileState[field.name].url} alt="File saat ini" />
							{:else}
								<a href={fileState[field.name].url} target="_blank" rel="noopener noreferrer">Lihat file saat ini</a>
							{/if}
						</div>
					{/if}
				{:else}
					<input type="text" name={field.name} value={values[field.name] ?? ''} required={field.required} />
				{/if}
				{#if errors[field.name]}
					<span class="field-error">{errors[field.name]}</span>
				{/if}
			</label>
		{/if}
	{/each}

	<div class="form-actions">
		<button type="submit" class="btn-primary" disabled={submitting || anyUploading}>
			{#if anyUploading}
				Menunggu upload selesai...
			{:else if submitting}
				Menyimpan...
			{:else}
				{submitLabel}
			{/if}
		</button>
		<a class="btn-secondary" href={cancelHref}>Batal</a>
	</div>
</form>
