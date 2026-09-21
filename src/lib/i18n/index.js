import id from './dictionaries/id.js';
import en from './dictionaries/en.js';

const DICTIONARIES = { id, en };

/**
 * Returns the full string dictionary for a locale, falling back to the
 * default (Indonesian) if an unknown/unsupported code somehow gets through.
 * Usage: `let t = $derived(getDictionary(data.locale));` then `{t.nav.home}`.
 */
export function getDictionary(locale) {
	return DICTIONARIES[locale] ?? DICTIONARIES.id;
}
