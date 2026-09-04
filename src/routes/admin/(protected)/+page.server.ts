import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const [{ count: skillsCount }, { count: statsCount }] = await Promise.all([
		supabase.from('skills').select('*', { count: 'exact', head: true }),
		supabase.from('stats').select('*', { count: 'exact', head: true })
	]);

	return {
		counts: {
			skills: skillsCount ?? 0,
			stats: statsCount ?? 0
		}
	};
};
