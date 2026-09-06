import { fail } from '@sveltejs/kit';
import { friendlyDbError } from '$lib/server/adminErrors';
import { reorderRow, compactAfterDelete } from '$lib/server/ranked';
import { recomputeAutoStats } from '$lib/server/autoStats';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const { data: projects, error: projectsError } = await supabase
		.from('projects')
		.select('*')
		.order('display_order');

	if (projectsError) console.error('[admin/projects] load failed:', projectsError.message);

	return { projects: projects ?? [] };
};

export const actions: Actions = {
	delete: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		if (!id) return fail(400, { error: 'ID tidak valid.' });

		const { data: deleted, error } = await supabase
			.from('projects')
			.delete()
			.eq('id', id)
			.select('display_order')
			.single();
		if (error) return fail(400, { error: error.message });

		if (deleted) {
			const { error: compactError } = await compactAfterDelete(supabase, 'projects', deleted.display_order);
			if (compactError) console.error('[admin/projects] compact failed:', compactError.message);
		}

		await recomputeAutoStats(supabase);

		return { success: true };
	},

	reorder: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		const newOrder = Number(formData.get('display_order'));
		if (!id || Number.isNaN(newOrder)) return fail(400, { error: 'Data tidak valid.' });

		const { error } = await reorderRow(supabase, 'projects', id, newOrder);
		if (error) return fail(400, { error: friendlyDbError(error) });

		return { success: true };
	}
};
