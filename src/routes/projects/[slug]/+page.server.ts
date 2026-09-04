import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals: { supabase }, setHeaders }) => {
	const { data: project } = await supabase
		.from('projects')
		.select('*, project_tags(tags(label)), project_sections(*)')
		.eq('slug', params.slug)
		.eq('is_published', true)
		.single();

	if (!project) {
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

	return {
		project,
		otherProjects: otherProjects ?? []
	};
};
