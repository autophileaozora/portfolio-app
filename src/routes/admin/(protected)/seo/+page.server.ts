import { fail } from '@sveltejs/kit';
import { seoSettingsSchema } from '$lib/validation/schemas';
import { friendlyDbError } from '$lib/server/adminErrors';
import type { Actions, PageServerLoad } from './$types';

function hostnameOf(referrer: string | null): string {
	if (!referrer) return 'Langsung (tanpa referrer)';
	try {
		return new URL(referrer).hostname.replace(/^www\./, '');
	} catch {
		return referrer.slice(0, 60);
	}
}

function topN<T>(list: T[], keyFn: (item: T) => string | null, n = 6) {
	const counts = new Map<string, number>();
	for (const item of list) {
		const key = keyFn(item);
		if (!key) continue;
		counts.set(key, (counts.get(key) ?? 0) + 1);
	}
	return [...counts.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, n)
		.map(([label, count]) => ({ label, count }));
}

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const { data: seoSettings, error: seoError } = await supabase
		.from('seo_settings')
		.select('*')
		.eq('id', 1)
		.single();

	if (seoError) console.error('[admin/seo] seo_settings load failed:', seoError.message);

	// Aggregated in JS from a bounded window of raw events rather than a
	// SQL GROUP BY / RPC — simplest option that doesn't need its own
	// migration, and completely fine at this site's real traffic volume.
	const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
	const { data: events, error: analyticsError } = await supabase
		.from('analytics_events')
		.select('*')
		.gte('created_at', since)
		.order('created_at', { ascending: false })
		.limit(3000);

	if (analyticsError) console.error('[admin/seo] analytics_events load failed:', analyticsError.message);

	const rows = events ?? [];
	const pageviews = rows.filter((r) => r.event_type === 'pageview');
	const durations = rows.filter((r) => r.event_type === 'duration' && r.duration_seconds != null);
	const sessionIds = new Set(rows.map((r) => r.session_id));
	const newSessionIds = new Set(rows.filter((r) => r.is_new_session).map((r) => r.session_id));

	const analytics = {
		hasData: rows.length > 0,
		totalPageviews: pageviews.length,
		uniqueSessions: sessionIds.size,
		newSessions: newSessionIds.size,
		returningSessions: Math.max(0, sessionIds.size - newSessionIds.size),
		avgDurationSeconds: durations.length
			? Math.round(durations.reduce((sum, r) => sum + (r.duration_seconds ?? 0), 0) / durations.length)
			: 0,
		errorCount: rows.filter((r) => r.event_type === 'error').length,
		topPages: topN(pageviews, (r) => r.path),
		topReferrers: topN(pageviews, (r) => hostnameOf(r.referrer)),
		topCountries: topN(rows, (r) => r.country),
		topBrowsers: topN(rows, (r) => r.browser),
		topDevices: topN(rows, (r) => r.device_type),
		recent: rows.slice(0, 50)
	};

	return { seoSettings: seoSettings ?? {}, analytics };
};

export const actions: Actions = {
	default: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();

		// favicon_url/og_image_url arrive pre-resolved to public URL
		// strings — the browser either uploads a new file directly to
		// Supabase Storage before submitting, or leaves the existing URL
		// untouched (see AdminForm.svelte), so there's no File/fallback
		// logic here.
		const raw = {
			site_name: formData.get('site_name'),
			favicon_url: formData.get('favicon_url'),
			og_image_url: formData.get('og_image_url'),
			google_site_verification: formData.get('google_site_verification')
		};

		const parsed = seoSettingsSchema.safeParse(raw);
		if (!parsed.success) {
			return fail(400, {
				error: 'Periksa kembali isian.',
				values: raw,
				fieldErrors: parsed.error.flatten().fieldErrors
			});
		}

		const { error } = await supabase.from('seo_settings').update(parsed.data).eq('id', 1);
		if (error) return fail(400, { error: friendlyDbError(error), values: raw });

		return { success: true, values: raw };
	}
};
