import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase }, setHeaders, url }) => {
	const { data: projects, error: projectsError } = await supabase
		.from('projects')
		.select('*')
		.eq('is_published', true)
		.order('display_order');

	if (projectsError) console.error('[+page.server.ts /projects] query failed:', projectsError.message);

	// no-store — see the identical comment in the Home page's +page.server.ts
	// (this page is locale-dependent too, and even a private/browser-only
	// cache can serve a pre-language-switch response back on the same URL).
	setHeaders({ 'cache-control': 'private, no-store' });

	return {
		projects: projects ?? [],
		canonicalUrl: `${url.origin}/projects`
	};
};
