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

/** Safe accessor into the flexible `metadata` JSONB column. */
function metaValue(metadata: unknown, key: string): unknown {
	if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return undefined;
	return (metadata as Record<string, unknown>)[key];
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

	// Entry/exit page + bounce rate — derived purely from the pageview
	// rows already fetched above, grouped by session and ordered by time;
	// no extra collection needed, just a different way of looking at the
	// same data.
	const pageviewsBySession = new Map<string, typeof pageviews>();
	for (const pv of pageviews) {
		const list = pageviewsBySession.get(pv.session_id) ?? [];
		list.push(pv);
		pageviewsBySession.set(pv.session_id, list);
	}
	const entryPaths: string[] = [];
	const exitPaths: string[] = [];
	let bouncedSessions = 0;
	for (const list of pageviewsBySession.values()) {
		const sorted = [...list].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
		const first = sorted[0];
		const last = sorted[sorted.length - 1];
		if (first?.path) entryPaths.push(first.path);
		if (last?.path) exitPaths.push(last.path);
		if (sorted.length === 1) bouncedSessions += 1;
	}

	// Goal completions (CV/Resume download, WhatsApp, live-project click,
	// message sent) — clicks tagged with metadata.goal by
	// AnalyticsTracker.svelte's detectGoal()/the ContactFooter success hook.
	const goalClicks = rows.filter((r) => r.event_type === 'click' && metaValue(r.metadata, 'goal'));
	const goalCounts = topN(goalClicks, (r) => String(metaValue(r.metadata, 'goal') ?? ''), 10);

	// Klik per jenis elemen (link/button/image) — tagged client-side by
	// AnalyticsTracker.svelte's onClick, including bare <img> clicks that
	// aren't inside any link/button at all.
	const clickEvents = rows.filter((r) => r.event_type === 'click');
	const elementTypeCounts = topN(clickEvents, (r) => String(metaValue(r.metadata, 'element_type') ?? 'lainnya'), 10);

	// Core Web Vitals (LCP/CLS) — real Google ranking factors, averaged
	// across whatever pageloads reported them.
	const webVitalRows = rows.filter((r) => r.event_type === 'web_vital');
	const lcpValues = webVitalRows
		.filter((r) => metaValue(r.metadata, 'metric') === 'LCP')
		.map((r) => metaValue(r.metadata, 'value_ms'))
		.filter((v): v is number => typeof v === 'number');
	const clsValues = webVitalRows
		.filter((r) => metaValue(r.metadata, 'metric') === 'CLS')
		.map((r) => metaValue(r.metadata, 'value'))
		.filter((v): v is number => typeof v === 'number');

	const analytics = {
		hasData: rows.length > 0,
		totalPageviews: pageviews.length,
		uniqueSessions: sessionIds.size,
		newSessions: newSessionIds.size,
		returningSessions: Math.max(0, sessionIds.size - newSessionIds.size),
		bounceRatePercent: pageviewsBySession.size ? Math.round((bouncedSessions / pageviewsBySession.size) * 100) : 0,
		avgDurationSeconds: durations.length
			? Math.round(durations.reduce((sum, r) => sum + (r.duration_seconds ?? 0), 0) / durations.length)
			: 0,
		errorCount: rows.filter((r) => r.event_type === 'error').length,
		notFoundCount: rows.filter((r) => r.event_type === 'not_found').length,
		avgLcpMs: lcpValues.length ? Math.round(lcpValues.reduce((s, v) => s + v, 0) / lcpValues.length) : null,
		avgCls: clsValues.length ? Math.round((clsValues.reduce((s, v) => s + v, 0) / clsValues.length) * 1000) / 1000 : null,
		topPages: topN(pageviews, (r) => r.path),
		topEntryPages: topN(
			entryPaths.map((path) => ({ path })),
			(r) => r.path
		),
		topExitPages: topN(
			exitPaths.map((path) => ({ path })),
			(r) => r.path
		),
		topReferrers: topN(pageviews, (r) => hostnameOf(r.referrer)),
		topCountries: topN(rows, (r) => r.country),
		topBrowsers: topN(rows, (r) => r.browser),
		topDevices: topN(rows, (r) => r.device_type),
		topGoals: goalCounts,
		topClickTypes: elementTypeCounts,
		topNotFound: topN(
			rows.filter((r) => r.event_type === 'not_found'),
			(r) => r.path
		),
		// Pre-extracted here (rather than left as raw `metadata` for the
		// template to dig into) so the values reaching +page.svelte are
		// already plain strings/numbers, not the general Json union type.
		recent: rows.slice(0, 50).map((r) => ({
			...r,
			goal: r.event_type === 'click' ? (metaValue(r.metadata, 'goal') as string | undefined) : undefined,
			elementType: r.event_type === 'click' ? (metaValue(r.metadata, 'element_type') as string | undefined) : undefined,
			webVitalMetric: r.event_type === 'web_vital' ? (metaValue(r.metadata, 'metric') as string | undefined) : undefined,
			webVitalValue:
				r.event_type === 'web_vital'
					? ((metaValue(r.metadata, 'value_ms') ?? metaValue(r.metadata, 'value')) as number | undefined)
					: undefined
		}))
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
