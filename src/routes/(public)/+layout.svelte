<script>
	import '$lib/styles/navbar.css';
	import '$lib/styles/contact-footer.css';
	import Navbar from '$lib/components/Navbar.svelte';
	import ContactFooter from '$lib/components/ContactFooter.svelte';
	import AnalyticsTracker from '$lib/components/AnalyticsTracker.svelte';

	let { data, children } = $props();

	// The project detail page's own +page.server.ts returns
	// `projectTestimonials` (testimonials specific to that project); every
	// other public route doesn't, so this is undefined there and the
	// general/site-wide pool from (public)/+layout.server.ts applies as
	// before. SvelteKit merges a descendant page's load data into `data`
	// here at runtime regardless, but its generated LayoutData type is built
	// only from this layout's own + ancestor load functions (no visibility
	// into child routes), so TS doesn't know about this property — hence
	// the cast, narrowly, rather than widening `data`'s type everywhere else
	// in this file. `??` deliberately does NOT fall back on an empty array
	// (deliberately-zero testimonials for a project is not the same as "no
	// override at all") — only on null/undefined, which is what a failed
	// query on that page returns too (see its own comment on why).
	let footerTestimonials = $derived(
		/** @type {{ projectTestimonials?: typeof data.testimonials | null }} */ (data).projectTestimonials ??
			data.testimonials
	);
</script>

<AnalyticsTracker />

<div id="navbar-root"><Navbar locale={data.locale} /></div>

{@render children()}

<div id="contact-footer-root">
	<ContactFooter
		profile={data.profile}
		testimonials={footerTestimonials}
		answeredMessages={data.answeredMessages}
		projects={data.projects}
		locale={data.locale}
	/>
</div>
