/**
 * Supported public-site languages. Starting with just these two — the
 * realistic audience for a personal portfolio (local + international
 * recruiters/clients) — but the list is intentionally the single source of
 * truth for the switcher UI (Navbar), the cookie-validation in
 * hooks.server.ts, and /api/set-locale, so adding a third language later is
 * just adding an entry here (plus its dictionary file).
 */
export const LOCALES = [
	{ code: 'id', label: 'Indonesia', shortLabel: 'ID' },
	{ code: 'en', label: 'English', shortLabel: 'EN' }
];

export const DEFAULT_LOCALE = 'id';

export function isValidLocale(code) {
	return typeof code === 'string' && LOCALES.some((l) => l.code === code);
}
