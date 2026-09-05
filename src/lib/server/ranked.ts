import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/supabase/database.types';

/** The four tables reorder_ranked_item/compact_ranked_table know how to touch. */
export type RankedTable = 'skills' | 'stats' | 'experience' | 'testimonials';

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
