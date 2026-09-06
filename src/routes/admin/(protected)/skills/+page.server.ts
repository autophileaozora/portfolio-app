import { fail, redirect } from '@sveltejs/kit';
import { friendlyDbError } from '$lib/server/adminErrors';
import { reorderRow, compactAfterDelete, nextDisplayOrder } from '$lib/server/ranked';
import { bulkSkillNamesSchema } from '$lib/validation/schemas';
import { recomputeAutoStats } from '$lib/server/autoStats';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const { data: skills, error: skillsError } = await supabase
		.from('skills')
		.select('*')
		.order('display_order');

	if (skillsError) console.error('[admin/skills] load failed:', skillsError.message);

	return { skills: skills ?? [] };
};

export const actions: Actions = {
	delete: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		if (!id) return fail(400, { error: 'ID tidak valid.' });

		const { data: deleted, error } = await supabase
			.from('skills')
			.delete()
			.eq('id', id)
			.select('display_order')
			.single();
		if (error) return fail(400, { error: error.message });

		if (deleted) {
			const { error: compactError } = await compactAfterDelete(supabase, 'skills', deleted.display_order);
			if (compactError) console.error('[admin/skills] compact failed:', compactError.message);
		}

		await recomputeAutoStats(supabase);

		return { success: true };
	},

	reorder: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		const newOrder = Number(formData.get('display_order'));
		if (!id || Number.isNaN(newOrder)) return fail(400, { error: 'Data tidak valid.' });

		const { error } = await reorderRow(supabase, 'skills', id, newOrder);
		if (error) return fail(400, { error: friendlyDbError(error) });

		return { success: true };
	},

	// Skills' doc-import is bulk (per the user's explicit choice, unlike
	// every other resource's one-record-per-upload flow) — a single
	// document listing several skill names inserts all of them at once,
	// each getting the next sequential display_order.
	bulkImport: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const parsed = bulkSkillNamesSchema.safeParse(formData.get('names_json'));
		if (!parsed.success) {
			return fail(400, { error: parsed.error.flatten().formErrors[0] ?? 'Data tidak valid.' });
		}

		const startOrder = await nextDisplayOrder(supabase, 'skills');
		const rows = parsed.data.map((name, i) => ({ name, display_order: startOrder + i }));

		const { error } = await supabase.from('skills').insert(rows);
		if (error) return fail(400, { error: friendlyDbError(error) });

		await recomputeAutoStats(supabase);

		redirect(303, `/admin/skills?bulkAdded=${rows.length}`);
	}
};
