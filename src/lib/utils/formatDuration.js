/**
 * Human-readable duration between two dates (e.g. "2 Weeks", "3 Months",
 * "1 Year 4 Months") — replaces the old free-text "Duration" field, which
 * is now always derived from date_start/date_end instead of typed by hand.
 * Returns '' if either date is missing (caller decides the fallback).
 */
export function formatDuration(start, end) {
	if (!start) return '';
	const startDate = new Date(start);
	const endDate = end ? new Date(end) : new Date();

	let months =
		(endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());
	if (endDate.getDate() < startDate.getDate()) months -= 1;
	months = Math.max(0, months);

	if (months < 1) {
		const days = Math.max(1, Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)));
		if (days < 14) return `${days} Day${days === 1 ? '' : 's'}`;
		const weeks = Math.round(days / 7);
		return `${weeks} Week${weeks === 1 ? '' : 's'}`;
	}

	const years = Math.floor(months / 12);
	const remMonths = months % 12;

	if (years === 0) return `${remMonths} Month${remMonths === 1 ? '' : 's'}`;
	if (remMonths === 0) return `${years} Year${years === 1 ? '' : 's'}`;
	return `${years} Year${years === 1 ? '' : 's'} ${remMonths} Month${remMonths === 1 ? '' : 's'}`;
}
