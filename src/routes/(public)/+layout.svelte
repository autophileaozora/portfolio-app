<script>
	import '$lib/styles/navbar.css';
	import '$lib/styles/contact-footer.css';
	import Navbar from '$lib/components/Navbar.svelte';
	import ContactFooter from '$lib/components/ContactFooter.svelte';

	let { data, children } = $props();
</script>

<div id="navbar-root"><Navbar /></div>

{@render children()}

<div id="contact-footer-root">
	<ContactFooter profile={data.profile} testimonials={data.testimonials} answeredMessages={data.answeredMessages} />
</div>
