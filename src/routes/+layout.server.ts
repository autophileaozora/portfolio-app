import type { LayoutServerLoad } from './$types';

/**
 * Site-wide SEO settings (favicon, Google Search Console verification meta
 * tag) — needed by the root layout so they apply on every page, admin
 * included, not just the public route group. A missing/never-created row
 * degrades gracefully (root layout falls back to the bundled default
 * favicon and simply omits the verification tag).
 */
export const load: LayoutServerLoad = async ({ locals: { supabase } }) => {
	const { data: seoSettings, error } = await supabase.from('seo_settings').select('*').eq('id', 1).maybeSingle();

	if (error) console.error('[+layout.server.ts] seo_settings query failed:', error.message);

	return { seoSettings: seoSettings ?? null };
};
