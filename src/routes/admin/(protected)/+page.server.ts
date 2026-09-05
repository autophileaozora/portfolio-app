import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const [
		{ count: skillsCount },
		{ count: statsCount },
		{ count: experienceCount },
		{ count: testimonialsCount },
		{ count: projectsCount }
	] = await Promise.all([
		supabase.from('skills').select('*', { count: 'exact', head: true }),
		supabase.from('stats').select('*', { count: 'exact', head: true }),
		supabase.from('experience').select('*', { count: 'exact', head: true }),
		supabase.from('testimonials').select('*', { count: 'exact', head: true }),
		supabase.from('projects').select('*', { count: 'exact', head: true })
	]);

	return {
		counts: {
			skills: skillsCount ?? 0,
			stats: statsCount ?? 0,
			experience: experienceCount ?? 0,
			testimonials: testimonialsCount ?? 0,
			projects: projectsCount ?? 0
		}
	};
};
