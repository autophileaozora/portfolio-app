import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase }, setHeaders }) => {
	const [{ data: featuredProjects }, { data: experience }, { data: skills }, { data: stats }] = await Promise.all([
		supabase
			.from('projects')
			.select('*, project_tags(tags(label))')
			.eq('is_published', true)
			.eq('is_featured', true)
			.order('display_order'),
		supabase.from('experience').select('*').order('display_order'),
		supabase.from('skills').select('*').order('display_order'),
		supabase.from('stats').select('*').order('display_order')
	]);

	setHeaders({ 'cache-control': 'public, s-maxage=60, stale-while-revalidate=300' });

	return {
		featuredProjects: featuredProjects ?? [],
		experience: experience ?? [],
		skills: skills ?? [],
		stats: stats ?? []
	};
};
