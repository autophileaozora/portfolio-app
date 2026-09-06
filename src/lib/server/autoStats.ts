import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/supabase/database.types';

/**
 * The 4 home-page stat cards are tracked automatically from real data
 * (published project count, skill count, unique contributors across all
 * published projects, and total career length summed across every work
 * experience entry) — see recomputeAutoStats below.
 *
 * Per the user's explicit choice, these stay ordinary rows in the `stats`
 * table (still editable by hand on /admin/stats, same CRUD as any other
 * stat) rather than being computed at render time — a manual edit on one
 * of these rows stays in effect until the NEXT time its underlying source
 * data changes (a project/skill/experience is added, edited, deleted, or
 * bulk-imported), at which point recomputeAutoStats overwrites `value`
 * again. Only `value` is ever touched here — a manually-renamed `label`
 * is left alone.
 *
 * Matched by fixed seed UUIDs (see supabase/migrations/..._seed_content.sql)
 * rather than a schema column, since these 4 ids are already stable and
 * known — no migration needed. If a row is ever deleted, it's silently
 * recreated (with its default label) instead of the metric just vanishing
 * from the home page.
 */
const AUTO_STAT_ROWS = {
	years_in_it: { id: '66666666-6666-6666-6666-666666666601', label: 'Years in IT Fields', display_order: 1 },
	projects_count: { id: '66666666-6666-6666-6666-666666666602', label: 'Impactful Projects', display_order: 2 },
	contributors_count: { id: '66666666-6666-6666-6666-666666666603', label: 'People Has Collaborate', display_order: 3 },
	skills_count: { id: '66666666-6666-6666-6666-666666666604', label: 'Technologies', display_order: 4 }
} as const;

type AutoStatKey = keyof typeof AUTO_STAT_ROWS;

/**
 * Whole months between two dates (end defaults to "now" for an ongoing
 * role with no date_end) — same month-counting logic as
 * lib/utils/formatDuration.js, used per-experience-row here instead of
 * for a single project's display string.
 */
function monthsBetween(start: string, end: string | null) {
	const startDate = new Date(start);
	const endDate = end ? new Date(end) : new Date();
	let months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());
	if (endDate.getDate() < startDate.getDate()) months -= 1;
	return Math.max(0, months);
}

async function computeAutoStatValues(supabase: SupabaseClient<Database>): Promise<Record<AutoStatKey, number>> {
	const [projectsCountRes, skillsCountRes, contributorsRes, experienceRes] = await Promise.all([
		supabase.from('projects').select('*', { count: 'exact', head: true }).eq('is_published', true),
		supabase.from('skills').select('*', { count: 'exact', head: true }),
		supabase.from('projects').select('contributors_list').eq('is_published', true),
		supabase.from('experience').select('date_start, date_end')
	]);

	const uniqueContributors = new Set<string>();
	for (const row of contributorsRes.data ?? []) {
		const list = Array.isArray(row.contributors_list) ? row.contributors_list : [];
		for (const c of list) {
			const name = typeof c === 'object' && c && 'name' in c ? String((c as { name?: unknown }).name ?? '') : '';
			const key = name.trim().toLowerCase();
			if (key) uniqueContributors.add(key);
		}
	}

	// Per the user's explicit choice: sum each experience entry's OWN
	// duration in months (not the span from the earliest start to now,
	// which overcounts if there were gaps between jobs, or undercounts
	// concurrent/overlapping roles), then convert the total to years.
	const totalMonths = (experienceRes.data ?? []).reduce(
		(sum, e) => (e.date_start ? sum + monthsBetween(e.date_start, e.date_end) : sum),
		0
	);
	const yearsInIt = Math.floor(totalMonths / 12);

	return {
		years_in_it: yearsInIt,
		projects_count: projectsCountRes.count ?? 0,
		contributors_count: uniqueContributors.size,
		skills_count: skillsCountRes.count ?? 0
	};
}

/**
 * Recomputes and overwrites the 4 auto-tracked stat rows' `value` from
 * live data. Call this after any mutation that could change one of them:
 * projects (create/update/delete — count and/or contributors), skills
 * (create/delete/bulk — count), experience (create/update/delete/bulk —
 * years). Never throws — a failure here shouldn't block the actual
 * mutation the admin was trying to make; it just logs and moves on.
 */
export async function recomputeAutoStats(supabase: SupabaseClient<Database>) {
	try {
		const values = await computeAutoStatValues(supabase);
		for (const key of Object.keys(AUTO_STAT_ROWS) as AutoStatKey[]) {
			const meta = AUTO_STAT_ROWS[key];
			const { data: updated, error } = await supabase
				.from('stats')
				.update({ value: values[key] })
				.eq('id', meta.id)
				.select('id');
			if (error) {
				console.error(`[recomputeAutoStats] update failed for ${key}:`, error.message);
				continue;
			}
			if (!updated || updated.length === 0) {
				// Row was deleted at some point — recreate it so the metric
				// doesn't just silently disappear from the home page.
				const { error: insertError } = await supabase
					.from('stats')
					.insert({ id: meta.id, label: meta.label, value: values[key], display_order: meta.display_order });
				if (insertError) console.error(`[recomputeAutoStats] recreate failed for ${key}:`, insertError.message);
			}
		}
	} catch (e) {
		console.error('[recomputeAutoStats] failed:', e instanceof Error ? e.message : e);
	}
}
