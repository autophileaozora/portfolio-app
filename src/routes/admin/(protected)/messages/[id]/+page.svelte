<script>
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let submitting = $state(false);

	function senderLabel() {
		return data.message.is_anonymous ? 'Anonim' : data.message.sender_name || '—';
	}

	// Either an existing project (joined via project_id) or a proposed new
	// one the sender typed in — never both, per messageSchema's own rule.
	let projectLabel = $derived(
		data.message.projects?.title ??
			(data.message.proposed_project_name ? `${data.message.proposed_project_name} (belum ada di daftar)` : null)
	);
</script>

<svelte:head>
	<title>Admin · Balas Pesan</title>
</svelte:head>

<div class="admin-page-header">
	<h1>Balas Pesan</h1>
</div>

<div class="admin-form" style="margin-bottom:1.5rem;">
	<div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.5rem;">
		{#if data.message.sender_avatar_url}
			<img
				src={data.message.sender_avatar_url}
				alt=""
				style="width:48px; height:48px; border-radius:50%; object-fit:cover; border:1px solid #e4e4ea;"
			/>
		{/if}
		<div>
			<p style="margin:0;"><strong>{senderLabel()}</strong></p>
			{#if data.message.sender_instagram}
				<p style="margin:0; font-size:0.82rem; color:#77777f;">
					<i class="fa-brands fa-instagram"></i> {data.message.sender_instagram}
				</p>
			{/if}
		</div>
	</div>
	{#if projectLabel}
		<p style="font-size:0.82rem; color:#4c3fd6; margin:0 0 0.5rem;">
			<i class="fa-solid fa-diagram-project"></i> Project: {projectLabel}
		</p>
	{/if}
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
