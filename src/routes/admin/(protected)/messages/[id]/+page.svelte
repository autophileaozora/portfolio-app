<script>
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let submitting = $state(false);

	function senderLabel() {
		return data.message.is_anonymous ? 'Anonim' : data.message.sender_name || '—';
	}
</script>

<svelte:head>
	<title>Admin · Balas Pesan</title>
</svelte:head>

<div class="admin-page-header">
	<h1>Balas Pesan</h1>
</div>

<div class="admin-form" style="margin-bottom:1.5rem;">
	<p><strong>{senderLabel()}</strong></p>
	<p>{data.message.content}</p>
</div>

{#if data.message.status === 'answered'}
	<p class="form-success-banner">Sudah dibalas: {data.message.admin_reply}</p>
{/if}

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
	{#if form?.error}
		<p class="form-error-banner">{form.error}</p>
	{/if}
	<label>
		Balasan
		<textarea name="admin_reply" required>{form?.values?.admin_reply ?? data.message.admin_reply ?? ''}</textarea>
	</label>
	<div class="form-actions">
		<button type="submit" class="btn-primary" disabled={submitting}>
			{submitting ? 'Mengirim...' : 'Kirim Balasan'}
		</button>
		<a class="btn-secondary" href="/admin/messages">Batal</a>
	</div>
</form>
