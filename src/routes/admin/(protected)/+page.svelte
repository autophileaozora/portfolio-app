<script>
	let { data } = $props();
</script>

<svelte:head>
	<title>Admin Dashboard</title>
</svelte:head>

<h1>Halo, {data.user.email}</h1>
<p>Panel admin untuk kelola konten portfolio akan muncul di sini.</p>

<style>
	h1 {
		margin: 0 0 0.5rem;
		font-size: 1.4rem;
	}

	p {
		color: #55555f;
		margin: 0;
	}
</style>
