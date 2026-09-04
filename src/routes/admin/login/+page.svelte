<script>
	import { enhance } from '$app/forms';

	let { form } = $props();
	let submitting = $state(false);
</script>

<svelte:head>
	<title>Admin Login</title>
</svelte:head>

<div class="login-wrap">
	<form
		class="login-card"
		method="POST"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				await update();
				submitting = false;
			};
		}}
	>
		<h1>Admin Login</h1>

		{#if form?.error}
			<p class="error">{form.error}</p>
		{/if}

		<label>
			Email
			<input type="email" name="email" value={form?.email ?? ''} required autocomplete="username" />
		</label>

		<label>
			Password
			<input type="password" name="password" required autocomplete="current-password" />
		</label>

		<button type="submit" disabled={submitting}>{submitting ? 'Masuk...' : 'Masuk'}</button>
	</form>
</div>

<style>
	.login-wrap {
		min-height: 100dvh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #0f0f12;
		padding: 1.5rem;
	}

	.login-card {
		width: 100%;
		max-width: 360px;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		background: #1a1a1f;
		border: 1px solid #2a2a31;
		border-radius: 12px;
		padding: 2rem;
	}

	h1 {
		margin: 0 0 0.5rem;
		font-size: 1.25rem;
		color: #fff;
		font-family: inherit;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		font-size: 0.85rem;
		color: #c9c9d1;
	}

	input {
		font: inherit;
		padding: 0.6rem 0.75rem;
		border-radius: 8px;
		border: 1px solid #33333c;
		background: #101014;
		color: #fff;
	}

	input:focus {
		outline: 2px solid #6c63ff;
		outline-offset: 1px;
	}

	button {
		margin-top: 0.5rem;
		padding: 0.7rem;
		border: none;
		border-radius: 8px;
		background: #6c63ff;
		color: #fff;
		font: inherit;
		font-weight: 600;
		cursor: pointer;
	}

	button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.error {
		margin: 0;
		padding: 0.6rem 0.75rem;
		border-radius: 8px;
		background: rgba(220, 38, 38, 0.15);
		border: 1px solid rgba(220, 38, 38, 0.4);
		color: #ff9d9d;
		font-size: 0.85rem;
	}
</style>
