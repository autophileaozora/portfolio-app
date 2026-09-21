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

	// private, not public — see the identical comment in the Home page's
	// +page.server.ts (this page is locale-dependent too, and a shared/CDN
	// cache doesn't vary by the `locale` cookie).
	setHeaders({ 'cache-control': 'private, max-age=60' });

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
		ogImage
	};
};
