<script>
	import { enhance } from '$app/forms';

	/**
	 * fields: [{ name, label, type: 'text'|'number'|'textarea'|'date'|'checkbox', required, default }]
	 * values/errors come from the +page.server.ts load (values) and form action
	 * fail() payload (errors), keyed by field name.
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
		{#if field.type === 'checkbox'}
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
