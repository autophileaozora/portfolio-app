import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url, locals: { supabase }, setHeaders }) => {
	const { data: project, error: projectError } = await supabase
		.from('projects')
		.select('*, project_tags(tags(label)), project_sections(*)')
		.eq('slug', params.slug)
		.eq('is_published', true)
		.single();

	if (!project) {
		if (projectError) console.error(`[+page.server.ts /projects/${params.slug}] query failed:`, projectError.message);
		error(404, 'Project not found');
	}

	const { data: otherProjects } = await supabase
		.from('projects')
		.select('*')
		.eq('is_published', true)
		.neq('slug', params.slug)
		.order('display_order')
		.limit(3);

	// Testimonials specific to THIS project — shown in the footer instead of
	// the general/site-wide pool (public)/+layout.server.ts already loads.
	// (public)/+layout.svelte prefers this list when it's present; an empty
	// array here (not null/undefined) means "this project genuinely has
	// none yet", which still overrides the general pool rather than falling
	// back to it — the footer's own empty state ("Belum ada testimonial.")
	// covers that case correctly.
	const { data: projectTestimonials, error: projectTestimonialsError } = await supabase
		.from('testimonials')
		.select('*')
		.eq('project_id', project.id)
		.eq('is_published', true)
		.order('display_order');

	if (projectTestimonialsError) {
		console.error(
			`[+page.server.ts /projects/${params.slug}] testimonials query failed:`,
			projectTestimonialsError.message
		);
	}

	// no-store — see the identical comment in the Home page's +page.server.ts
	// (this page is locale-dependent too, and even a private/browser-only
	// cache can serve a pre-language-switch response back on the same URL).
	setHeaders({ 'cache-control': 'private, no-store' });

	// No static fallback image — if the project has no thumbnail, the
	// og:image/twitter:image meta tags are just omitted (see +page.svelte)
	// rather than pointing at a generic placeholder graphic.
	const ogImage = project.thumbnail_url
		? project.thumbnail_url.startsWith('http')
			? project.thumbnail_url
			: `${url.origin}${project.thumbnail_url}`
		: null;

	return {
		project,
		otherProjects: otherProjects ?? [],
		canonicalUrl: `${url.origin}/projects/${params.slug}`,
		ogImage,
		// null (not []) specifically on a query failure, so the layout's
		// `data.projectTestimonials ?? data.testimonials` falls back to the
		// general pool instead of showing an empty footer — a genuinely
		// empty result (query succeeded, zero rows) stays [] on purpose, so
		// that case does NOT fall back (see the comment above this query).
		projectTestimonials: projectTestimonialsError ? null : (projectTestimonials ?? [])
	};
};
