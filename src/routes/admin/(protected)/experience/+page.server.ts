import { fail, redirect } from '@sveltejs/kit';
import { friendlyDbError } from '$lib/server/adminErrors';
import { reorderRow, compactAfterDelete, nextDisplayOrder } from '$lib/server/ranked';
import { bulkExperienceSchema } from '$lib/validation/schemas';
import { recomputeAutoStats } from '$lib/server/autoStats';
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

		await recomputeAutoStats(supabase);

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
	},

	// Experience's doc-import supports adding SEVERAL entries at once from
	// one document (per the user's explicit follow-up request), unlike the
	// single-record import on the Tambah/Edit form — each parsed entry gets
	// the next sequential display_order, no image_url (bulk import never
	// touches images).
	bulkImport: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const parsed = bulkExperienceSchema.safeParse(formData.get('entries_json'));
		if (!parsed.success) {
			return fail(400, { error: parsed.error.flatten().formErrors[0] ?? 'Data tidak valid.' });
		}

		const startOrder = await nextDisplayOrder(supabase, 'experience');
		const rows = parsed.data.map((entry, i) => ({ ...entry, display_order: startOrder + i }));

		const { error } = await supabase.from('experience').insert(rows);
		if (error) return fail(400, { error: friendlyDbError(error) });

		await recomputeAutoStats(supabase);

		redirect(303, `/admin/experience?bulkAdded=${rows.length}`);
	}
};
