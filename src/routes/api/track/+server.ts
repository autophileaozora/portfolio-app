import { json } from '@sveltejs/kit';
import { parseUserAgent } from '$lib/server/parseUserAgent';
import type { Json } from '$lib/supabase/database.types';
import type { RequestHandler } from './$types';

const EVENT_TYPES = new Set(['pageview', 'click', 'scroll', 'error', 'duration', 'web_vital', 'not_found']);

function str(v: unknown, max: number): string | null {
	if (typeof v !== 'string' || !v.trim()) return null;
	return v.slice(0, max);
}
function num(v: unknown): number | null {
	return typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : null;
}

/**
 * Public visitor-analytics ingestion endpoint — a plain +server.ts route
 * (not under /admin), so any visitor's browser (including anonymous ones)
 * can POST to it; the anon Supabase client used here is restricted by RLS
 * to INSERT-only on analytics_events (see the migration), so this can
 * never be used to read anyone else's data back.
 *
 * IP/geo/browser/OS/device are ALWAYS derived here from the request
 * itself (headers, Vercel's edge geo headers) rather than trusted from
 * whatever the client claims in its JSON body — the client is the right
 * source only for things a server genuinely can't know (screen size,
 * language, timezone, scroll/click/error details).
 */
export const POST: RequestHandler = async ({ request, locals: { supabase } }) => {
	let body: Record<string, unknown>;
	try {
		body = await request.json();
	} catch {
		return json({ ok: false }, { status: 400 });
	}

	const sessionId = str(body.session_id, 100);
	if (!sessionId) return json({ ok: false, message: 'session_id wajib diisi.' }, { status: 400 });

	const eventTypeRaw = typeof body.event_type === 'string' ? body.event_type : 'pageview';
	const eventType = EVENT_TYPES.has(eventTypeRaw) ? eventTypeRaw : 'pageview';

	const ua = request.headers.get('user-agent') ?? '';
	const { browser, os, deviceType } = parseUserAgent(ua);

	// x-forwarded-for can carry a comma-separated chain (client, proxy1,
	// proxy2, ...) — the first entry is the actual client.
	const ip =
		request.headers.get('x-vercel-forwarded-for') ||
		request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
		null;

	// Free, no third-party geo-IP lookup needed — Vercel's edge network
	// injects these on every request in production. Absent in local dev.
	const country = request.headers.get('x-vercel-ip-country') || null;
	const region = request.headers.get('x-vercel-ip-country-region') || null;
	const cityHeader = request.headers.get('x-vercel-ip-city');
	const city = cityHeader ? decodeURIComponent(cityHeader) : null;

	// The Referer HEADER is only present on the actual navigation request
	// (server-rendered first load); for client-side route changes within
	// the SPA there's no new request for the server to read a referer
	// from, so the client-reported document.referrer fills that gap.
	const referrer = str(body.referrer, 500) || request.headers.get('referer') || null;

	const row = {
		session_id: sessionId,
		is_new_session: body.is_new_session === true,
		event_type: eventType,
		path: str(body.path, 300),
		referrer,
		utm_source: str(body.utm_source, 120),
		utm_medium: str(body.utm_medium, 120),
		utm_campaign: str(body.utm_campaign, 120),
		ip_address: ip,
		country,
		region,
		city,
		browser,
		os,
		device_type: deviceType,
		screen_width: num(body.screen_width),
		screen_height: num(body.screen_height),
		language: str(body.language, 20),
		timezone: str(body.timezone, 60),
		duration_seconds: num(body.duration_seconds),
		scroll_percent: num(body.scroll_percent),
		label: str(body.label, 300),
		metadata: (body.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata)
			? (body.metadata as Json)
			: null) as Json
	};

	const { error } = await supabase.from('analytics_events').insert(row);
	if (error) {
		console.error('[api/track] insert failed:', error.message);
		return json({ ok: false }, { status: 500 });
	}

	return json({ ok: true });
};
