import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase }, setHeaders }) => {
	const { data: projects } = await supabase
		.from('projects')
		.select('*')
		.eq('is_published', true)
		.order('display_order');

	setHeaders({ 'cache-control': 'public, s-maxage=60, stale-while-revalidate=300' });

	return {
		projects: projects ?? []
	};
};
