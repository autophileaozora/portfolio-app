import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/supabase/database.types';

/** The tables reorder_ranked_item/compact_ranked_table know how to touch. */
export type RankedTable = 'skills' | 'stats' | 'experience' | 'testimonials' | 'projects';

/** Next display_order for a new row: append to the end (max + 1). */
export async function nextDisplayOrder(supabase: SupabaseClient<Database>, table: RankedTable) {
	const { data } = await supabase
		.from(table)
		.select('display_order')
		.order('display_order', { ascending: false })
		.limit(1)
		.maybeSingle();

	return (data?.display_order ?? 0) + 1;
}

/** Moves one row to a new position, shifting every row in between. */
export function reorderRow(
	supabase: SupabaseClient<Database>,
	table: RankedTable,
	id: string,
	newOrder: number
) {
	return supabase.rpc('reorder_ranked_item', { target_table: table, target_id: id, new_order: newOrder });
}

/** Closes the gap left by a delete so display_order stays a dense 1..N. */
export function compactAfterDelete(
	supabase: SupabaseClient<Database>,
	table: RankedTable,
	deletedOrder: number
) {
	return supabase.rpc('compact_ranked_table', { target_table: table, deleted_order: deletedOrder });
}

export type SectionType = 'problem' | 'solution' | 'result' | 'documentation';

/**
 * project_sections orders independently within each (project_id, type)
 * group — a project's Problem cards and Documentation slides each have
 * their own 1..N sequence, since that's the only order the public site
 * ever reads (see [slug]/+page.svelte's sectionsByType).
 */
export async function nextSectionOrder(
	supabase: SupabaseClient<Database>,
	projectId: string,
	type: SectionType
) {
	const { data } = await supabase
		.from('project_sections')
		.select('display_order')
		.eq('project_id', projectId)
		.eq('type', type)
		.order('display_order', { ascending: false })
		.limit(1)
		.maybeSingle();

	return (data?.display_order ?? 0) + 1;
}

export function reorderSection(supabase: SupabaseClient<Database>, sectionId: string, newOrder: number) {
	return supabase.rpc('reorder_project_section', { section_id: sectionId, new_order: newOrder });
}

export function compactSectionsAfterDelete(
	supabase: SupabaseClient<Database>,
	projectId: string,
	type: SectionType,
	deletedOrder: number
) {
	return supabase.rpc('compact_project_sections', {
		target_project_id: projectId,
		target_type: type,
		deleted_order: deletedOrder
	});
}
