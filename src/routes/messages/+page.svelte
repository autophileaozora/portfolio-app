<script>
	/**
	 * Only ever reached without JS (the real form lives in ContactFooter and
	 * submits here via use:enhance, staying on whatever public page it was
	 * opened from). This is just the graceful-degradation fallback.
	 */
	let { form } = $props();
</script>

<svelte:head>
	<title>Kirim Pesan</title>
</svelte:head>

<main style="max-width:480px;margin:4rem auto;padding:0 1.5rem;font-family:system-ui,sans-serif;">
	{#if form?.success}
		<h1>Terima kasih!</h1>
		<p>Pesan kamu sudah terkirim.</p>
	{:else if form?.error}
		<h1>Gagal mengirim</h1>
		<p>{form.error}</p>
	{:else}
		<h1>Kirim Pesan</h1>
		<p>Gunakan form di halaman utama untuk mengirim pesan.</p>
	{/if}
	<p><a href="/">&larr; Kembali ke beranda</a></p>
</main>
