import { fail } from '@sveltejs/kit';
import { friendlyDbError } from '$lib/server/adminErrors';
import { reorderRow, compactAfterDelete } from '$lib/server/ranked';
import { recomputeAutoStats } from '$lib/server/autoStats';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const { data: stats, error: statsError } = await supabase
		.from('stats')
		.select('*')
		.order('display_order');

	if (statsError) console.error('[admin/stats] load failed:', statsError.message);

	return { stats: stats ?? [] };
};

export const actions: Actions = {
	delete: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		if (!id) return fail(400, { error: 'ID tidak valid.' });

		const { data: deleted, error } = await supabase
			.from('stats')
			.delete()
			.eq('id', id)
			.select('display_order')
			.single();
		if (error) return fail(400, { error: error.message });

		if (deleted) {
			const { error: compactError } = await compactAfterDelete(supabase, 'stats', deleted.display_order);
			if (compactError) console.error('[admin/stats] compact failed:', compactError.message);
		}

		return { success: true };
	},

	reorder: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		const newOrder = Number(formData.get('display_order'));
		if (!id || Number.isNaN(newOrder)) return fail(400, { error: 'Data tidak valid.' });

		const { error } = await reorderRow(supabase, 'stats', id, newOrder);
		if (error) return fail(400, { error: friendlyDbError(error) });

		return { success: true };
	},

	// Manual trigger for the 4 auto-tracked rows (Impactful Projects/
	// Technologies/People Has Collaborate/Years in IT Fields) — they
	// normally recompute on their own whenever a project/skill/experience
	// changes, but this lets the admin force a fresh sync on demand (e.g.
	// right after this feature first ships, before any other edit has
	// happened yet to trigger it naturally).
	recompute: async ({ locals: { supabase } }) => {
		await recomputeAutoStats(supabase);
		return { synced: true };
	}
};
