<script>
	import { enhance } from '$app/forms';

	/**
	 * fields: [{
	 *   name, label, required, default,
	 *   type: 'text'|'number'|'textarea'|'date'|'checkbox'|'select'|'file'|'hidden',
	 *   options,   // 'select' only: [{ value, label }] or plain strings
	 *   accept,    // 'file' only: <input accept=""> filter, e.g. 'image/*'
	 *   isImage,   // 'file' only: preview as <img> instead of a plain link
	 *   value      // 'hidden' only: fixed value, not sourced from `values`
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
