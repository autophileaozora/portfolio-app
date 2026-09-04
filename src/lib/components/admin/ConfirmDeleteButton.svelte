<script>
	import { enhance } from '$app/forms';

	let { id } = $props();
	let confirming = $state(false);
</script>

<form
	method="POST"
	action="?/delete"
	class="confirm-delete-inline"
	use:enhance={() => {
		return async ({ update }) => {
			confirming = false;
			await update();
		};
	}}
>
	<input type="hidden" name="id" value={id} />
	{#if confirming}
		<span>Yakin?</span>
		<button type="submit" class="btn-danger">Ya</button>
		<button type="button" class="btn-plain" onclick={() => (confirming = false)}>Batal</button>
	{:else}
		<button type="button" class="btn-link-danger" onclick={() => (confirming = true)}>Hapus</button>
	{/if}
</form>
