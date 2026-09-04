import { fail } from '@sveltejs/kit';
import { friendlyDbError } from '$lib/server/adminErrors';
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

		const { error } = await supabase.from('stats').delete().eq('id', id);
		if (error) return fail(400, { error: error.message });

		return { success: true };
	},

	reorder: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		const displayOrder = Number(formData.get('display_order'));
		if (!id || Number.isNaN(displayOrder)) return fail(400, { error: 'Data tidak valid.' });

		const { error } = await supabase.from('stats').update({ display_order: displayOrder }).eq('id', id);
		if (error) return fail(400, { error: friendlyDbError(error) });

		return { success: true };
	}
};
