import { fail } from '@sveltejs/kit';
import { friendlyDbError } from '$lib/server/adminErrors';
import { reorderRow, compactAfterDelete } from '$lib/server/ranked';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const { data: experience, error: experienceError } = await supabase
		.from('experience')
		.select('*')
		.order('display_order');

	if (experienceError) console.error('[admin/experience] load failed:', experienceError.message);

	return { experience: experience ?? [] };
};

export const actions: Actions = {
	delete: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		if (!id) return fail(400, { error: 'ID tidak valid.' });

		const { data: deleted, error } = await supabase
			.from('experience')
			.delete()
			.eq('id', id)
			.select('display_order')
			.single();
		if (error) return fail(400, { error: error.message });

		if (deleted) {
			const { error: compactError } = await compactAfterDelete(supabase, 'experience', deleted.display_order);
			if (compactError) console.error('[admin/experience] compact failed:', compactError.message);
		}

		return { success: true };
	},

	reorder: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		const newOrder = Number(formData.get('display_order'));
		if (!id || Number.isNaN(newOrder)) return fail(400, { error: 'Data tidak valid.' });

		const { error } = await reorderRow(supabase, 'experience', id, newOrder);
		if (error) return fail(400, { error: friendlyDbError(error) });

		return { success: true };
	}
};
