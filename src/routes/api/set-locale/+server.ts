import { redirect } from '@sveltejs/kit';
import { isValidLocale, DEFAULT_LOCALE } from '$lib/i18n/locales';
import type { RequestHandler } from './$types';

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * A real, no-JS-required navigation (plain <a href> in the Navbar flag
 * dropdown) rather than a fetch+client-side cookie write — consistent with
 * this site's existing data-sveltekit-reload pattern, and it means the
 * whole page re-renders server-side in the new language immediately, no
 * flash-of-old-language possible.
 */
export const GET: RequestHandler = ({ url, cookies }) => {
	const requested = url.searchParams.get('locale');
	const locale = requested && isValidLocale(requested) ? requested : DEFAULT_LOCALE;

	cookies.set('locale', locale, {
		path: '/',
		maxAge: ONE_YEAR_SECONDS,
		sameSite: 'lax'
	});

	// Only ever redirect back to a same-site relative path — the query
	// param is attacker-controlled, so never trust it as an absolute URL
	// (open-redirect risk) or a protocol-relative one (`//evil.com`).
	const requestedRedirect = url.searchParams.get('redirect');
	const safeTarget =
		requestedRedirect && requestedRedirect.startsWith('/') && !requestedRedirect.startsWith('//')
			? requestedRedirect
			: '/';

	throw redirect(303, safeTarget);
};
