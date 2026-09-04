<script>
	import favicon from '$lib/assets/favicon.svg';
	import '$lib/styles/navbar.css';
	import '$lib/styles/contact-footer.css';
	import Navbar from '$lib/components/Navbar.svelte';
	import ContactFooter from '$lib/components/ContactFooter.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div id="navbar-root"><Navbar /></div>

{@render children()}

<div id="contact-footer-root"><ContactFooter /></div>
