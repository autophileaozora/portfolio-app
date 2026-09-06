<script>
	import { enhance } from '$app/forms';

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
	 *   value,      // 'hidden' only: fixed value, not sourced from `values`
	 *   itemFields  // 'repeater' only: [{ name, label, type?, options?, accept? }]
	 *               // — one input per sub-field per row, defaulting to a plain
	 *               // text input; itemField.type 'select' renders a dropdown
	 *               // (itemField.options, same shape as a top-level select),
	 *               // itemField.type 'file' renders a per-row file input.
	 *               // Text/select sub-fields serialize into one JSON string in
	 *               // a hidden input named `field.name` (see
	 *               // contributorsListSchema for the pattern this pairs with).
	 *               // A 'file' sub-field can't travel through that JSON, so
	 *               // it's submitted as its own field named
	 *               // `${field.name}__${row's stable id}__${itemField.name}`
	 *               // — the row's id also rides along inside the JSON as
	 *               // `_rowId` so the action can match the two back up.
	 * }]
	 * values/errors come from the +page.server.ts load (values) and form action
	 * fail() payload (errors), keyed by field name. multipart is always on so
	 * 'file' fields work — harmless for plain fields too.
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
		return JSON.stringify(repeaterRows[fieldName].map(({ __id, ...rest }) => ({ ...rest, _rowId: __id })));
	}
	function repeaterFileFieldName(field, row, itemField) {
		return `${field.name}__${row.__id}__${itemField.name}`;
	}
</script>

<form
	class="admin-form"
	method="POST"
	enctype="multipart/form-data"
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
										name={repeaterFileFieldName(field, row, itemField)}
										accept={itemField.accept}
									/>
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
					<input type="file" name={field.name} accept={field.accept} />
					{#if values[field.name]}
						<div class="current-file-preview">
							{#if field.isImage}
								<img src={values[field.name]} alt="File saat ini" />
							{:else}
								<a href={values[field.name]} target="_blank" rel="noopener noreferrer">Lihat file saat ini</a>
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
		<button type="submit" class="btn-primary" disabled={submitting}>
			{submitting ? 'Menyimpan...' : submitLabel}
		</button>
		<a class="btn-secondary" href={cancelHref}>Batal</a>
	</div>
</form>
