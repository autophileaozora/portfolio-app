import type { LayoutServerLoad } from './$types';

/**
 * Shared data for Navbar/ContactFooter, which live in the root layout and
 * render on every page. Deliberately does NOT call setHeaders() here — each
 * leaf +page.server.ts sets its own Cache-Control, and SvelteKit errors if
 * two loads in the same chain both set the same header.
 */
export const load: LayoutServerLoad = async ({ locals: { supabase } }) => {
	const [{ data: profile, error: profileError }, { data: testimonials, error: testimonialsError }] = await Promise.all([
		supabase.from('profile').select('*').eq('id', 1).single(),
		supabase.from('testimonials').select('*').eq('is_published', true).order('display_order')
	]);

	if (profileError) console.error('[+layout.server.ts] profile query failed:', profileError.message);
	if (testimonialsError) console.error('[+layout.server.ts] testimonials query failed:', testimonialsError.message);

	return {
		profile,
		testimonials: testimonials ?? []
	};
};
