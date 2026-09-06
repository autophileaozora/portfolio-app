<script>
	import defaultFavicon from '$lib/assets/favicon.svg';

	let { data, children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={data.seoSettings?.favicon_url || defaultFavicon} />
	{#if data.seoSettings?.google_site_verification}
		<meta name="google-site-verification" content={data.seoSettings.google_site_verification} />
	{/if}
</svelte:head>

{@render children()}
