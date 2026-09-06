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

	setHeaders({ 'cache-control': 'public, s-maxage=60, stale-while-revalidate=300' });

	const ogImage = project.thumbnail_url
		? project.thumbnail_url.startsWith('http')
			? project.thumbnail_url
			: `${url.origin}${project.thumbnail_url}`
		: `${url.origin}/assets/hero.png`;

	return {
		project,
		otherProjects: otherProjects ?? [],
		canonicalUrl: `${url.origin}/projects/${params.slug}`,
		ogImage
	};
};
