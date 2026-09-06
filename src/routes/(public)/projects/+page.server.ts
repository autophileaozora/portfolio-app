import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase }, setHeaders, url }) => {
	const { data: projects, error: projectsError } = await supabase
		.from('projects')
		.select('*')
		.eq('is_published', true)
		.order('display_order');

	if (projectsError) console.error('[+page.server.ts /projects] query failed:', projectsError.message);

	setHeaders({ 'cache-control': 'public, s-maxage=60, stale-while-revalidate=300' });

	return {
		projects: projects ?? [],
		canonicalUrl: `${url.origin}/projects`
	};
};
