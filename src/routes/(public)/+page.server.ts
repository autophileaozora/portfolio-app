import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase }, setHeaders, url }) => {
	const [
		{ data: featuredProjects, error: projectsError },
		{ data: experience, error: experienceError },
		{ data: skills, error: skillsError },
		{ data: stats, error: statsError }
	] = await Promise.all([
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

	if (projectsError) console.error('[+page.server.ts /] projects query failed:', projectsError.message);
	if (experienceError) console.error('[+page.server.ts /] experience query failed:', experienceError.message);
	if (skillsError) console.error('[+page.server.ts /] skills query failed:', skillsError.message);
	if (statsError) console.error('[+page.server.ts /] stats query failed:', statsError.message);

	// The hero carousel and the "PROJECTS" section further down both key
	// off this same list — if nothing has been marked "Unggulan" yet
	// (a curation step the admin might just not have gotten to), both
	// sections rendered completely empty rather than showing anything at
	// all. Falls back to the most recently DATED published projects
	// (same "newest first" ordering the Projects listing page's own sort
	// already uses) so there's always something to show here.
	let homeProjects = featuredProjects ?? [];
	if (homeProjects.length === 0) {
		const { data: recentProjects, error: recentError } = await supabase
			.from('projects')
			.select('*, project_tags(tags(label))')
			.eq('is_published', true)
			.order('date_start', { ascending: false, nullsFirst: false })
			.limit(6);

		if (recentError) console.error('[+page.server.ts /] recent projects fallback query failed:', recentError.message);
		homeProjects = recentProjects ?? [];
	}

	setHeaders({ 'cache-control': 'public, s-maxage=60, stale-while-revalidate=300' });

	return {
		featuredProjects: homeProjects,
		experience: experience ?? [],
		skills: skills ?? [],
		stats: stats ?? [],
		canonicalUrl: `${url.origin}/`
	};
};
