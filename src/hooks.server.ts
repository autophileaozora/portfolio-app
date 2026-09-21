import type { Handle } from '@sveltejs/kit';
import { createSupabaseServerClient } from '$lib/supabase/server';
import { isValidLocale, DEFAULT_LOCALE } from '$lib/i18n/locales';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createSupabaseServerClient(event);

	// Public-site language switcher — cookie set by /api/set-locale (never
	// trust the raw cookie value beyond checking it's one of the known
	// codes). Admin pages ignore this entirely (that UI stays Indonesian);
	// it only matters where (public)/+layout.server.ts forwards it into
	// `data.locale`.
	const cookieLocale = event.cookies.get('locale');
	event.locals.locale = cookieLocale && isValidLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;

	/**
	 * Use getUser() (not getSession()) to actually revalidate the JWT against
	 * Supabase Auth rather than trusting an unverified cookie value.
	 */
	event.locals.safeGetSession = async () => {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();
		if (!session) {
			return { session: null, user: null };
		}

		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser();
		if (error) {
			return { session: null, user: null };
		}

		return { session, user };
	};

	return resolve(event, {
		// Sets the real <html lang> per-request server-side (see the %lang%
		// placeholder in app.html) — avoids both a hydration flash and the
		// accessibility/SEO cost of a permanently-wrong lang attribute that a
		// client-only fix would leave in the initial HTML.
		transformPageChunk: ({ html }) => html.replace('%lang%', event.locals.locale),
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};
