<script>
	import { enhance } from '$app/forms';

	/**
	 * fields: [{ name, label, type: 'text'|'number'|'textarea', required, default }]
	 * values/errors come from the +page.server.ts load (values) and form action
	 * fail() payload (errors), keyed by field name.
	 */
	let { fields, values = {}, errors = {}, formError = '', cancelHref, submitLabel = 'Simpan' } = $props();

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
	{/if}

	{#each fields as field (field.name)}
		<label>
			{field.label}
			{#if field.type === 'number'}
				<input
					type="number"
					name={field.name}
					value={values[field.name] ?? field.default ?? 0}
					required={field.required}
				/>
			{:else if field.type === 'textarea'}
				<textarea name={field.name} required={field.required}>{values[field.name] ?? ''}</textarea>
			{:else}
				<input type="text" name={field.name} value={values[field.name] ?? ''} required={field.required} />
			{/if}
			{#if errors[field.name]}
				<span class="field-error">{errors[field.name]}</span>
			{/if}
		</label>
	{/each}

	<div class="form-actions">
		<button type="submit" class="btn-primary" disabled={submitting}>
			{submitting ? 'Menyimpan...' : submitLabel}
		</button>
		<a class="btn-secondary" href={cancelHref}>Batal</a>
	</div>
</form>
