import type { PageServerLoad } from './$types';

const PROJECT_SELECT = '*, project_tags(tags(label))';

export const load: PageServerLoad = async ({ locals: { supabase }, setHeaders, url }) => {
	const [
		{ data: featuredProjects, error: projectsError },
		{ data: experience, error: experienceError },
		{ data: skills, error: skillsError },
		{ data: stats, error: statsError }
	] = await Promise.all([
		supabase.from('projects').select(PROJECT_SELECT).eq('is_published', true).eq('is_featured', true).order('display_order'),
		supabase.from('experience').select('*').order('display_order'),
		supabase.from('skills').select('*').order('display_order'),
		supabase.from('stats').select('*').order('display_order')
	]);

	if (projectsError) console.error('[+page.server.ts /] projects query failed:', projectsError.message);
	if (experienceError) console.error('[+page.server.ts /] experience query failed:', experienceError.message);
	if (skillsError) console.error('[+page.server.ts /] skills query failed:', skillsError.message);
	if (statsError) console.error('[+page.server.ts /] stats query failed:', statsError.message);

	// The "PROJECTS" section further down the page — if nothing has been
	// marked "Unggulan" yet (a curation step the admin might just not have
	// gotten to), falls back to the most recently DATED published
	// projects (same "newest first" ordering the Projects listing page's
	// own sort already uses) so there's always something to show here.
	let homeProjects = featuredProjects ?? [];
	if (homeProjects.length === 0) {
		const { data: recentProjects, error: recentError } = await supabase
			.from('projects')
			.select(PROJECT_SELECT)
			.eq('is_published', true)
			.order('date_start', { ascending: false, nullsFirst: false })
			.limit(6);

		if (recentError) console.error('[+page.server.ts /] recent projects fallback query failed:', recentError.message);
		homeProjects = recentProjects ?? [];
	}

	// The hero carousel at the very top shows the projects with the most
	// views instead — analytics_events has no anon SELECT policy (real
	// visitor PII lives there), so this goes through a security-definer
	// RPC that only ever returns an id + a count, never a raw event row.
	let heroProjects: typeof homeProjects = [];
	const { data: topViewed, error: topViewedError } = await supabase.rpc('get_top_viewed_projects', {
		result_limit: 6
	});
	if (topViewedError) {
		console.error('[+page.server.ts /] get_top_viewed_projects failed:', topViewedError.message);
	} else if (topViewed && topViewed.length > 0) {
		const rankedIds = topViewed.map((r) => r.project_id);
		const { data: viewedRows, error: viewedRowsError } = await supabase
			.from('projects')
			.select(PROJECT_SELECT)
			.in('id', rankedIds);
		if (viewedRowsError) console.error('[+page.server.ts /] top-viewed projects query failed:', viewedRowsError.message);

		// .in() doesn't preserve the RPC's rank order, so re-sort by it.
		const byId = new Map((viewedRows ?? []).map((p) => [p.id, p]));
		heroProjects = rankedIds.map((id) => byId.get(id)).filter((p): p is NonNullable<typeof p> => Boolean(p));
	}
	// No view data yet (fresh deploy, or genuinely zero traffic so far) —
	// reuse whatever the section below already resolved to rather than a
	// third query, so the hero isn't empty in the meantime either.
	if (heroProjects.length === 0) heroProjects = homeProjects;

	setHeaders({ 'cache-control': 'public, s-maxage=60, stale-while-revalidate=300' });

	return {
		featuredProjects: homeProjects,
		heroProjects,
		experience: experience ?? [],
		skills: skills ?? [],
		stats: stats ?? [],
		canonicalUrl: `${url.origin}/`
	};
};
