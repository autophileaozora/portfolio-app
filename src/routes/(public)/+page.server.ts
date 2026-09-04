import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase }, setHeaders }) => {
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

	setHeaders({ 'cache-control': 'public, s-maxage=60, stale-while-revalidate=300' });

	return {
		featuredProjects: featuredProjects ?? [],
		experience: experience ?? [],
		skills: skills ?? [],
		stats: stats ?? []
	};
};
