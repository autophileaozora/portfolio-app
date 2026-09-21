import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase }, setHeaders, url }) => {
	const { data: projects, error: projectsError } = await supabase
		.from('projects')
		.select('*')
		.eq('is_published', true)
		.order('display_order');

	if (projectsError) console.error('[+page.server.ts /projects] query failed:', projectsError.message);

	// private, not public — see the identical comment in the Home page's
	// +page.server.ts (this page is locale-dependent too, and a shared/CDN
	// cache doesn't vary by the `locale` cookie).
	setHeaders({ 'cache-control': 'private, max-age=60' });

	return {
		projects: projects ?? [],
		canonicalUrl: `${url.origin}/projects`
	};
};
