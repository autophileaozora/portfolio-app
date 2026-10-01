import { fail } from '@sveltejs/kit';
import { friendlyDbError } from '$lib/server/adminErrors';
import { reorderRow, compactAfterDelete } from '$lib/server/ranked';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const { data: withProject, error: withProjectError } = await supabase
		.from('testimonials')
		.select('*, project:projects(title)')
		.order('display_order');

	let rows: { project_title: string; [key: string]: unknown }[];

	if (withProjectError) {
		// The embedded `project:projects(title)` requires the project_id FK
		// to actually exist — until the migration adding it has been run,
		// PostgREST can't resolve that relationship and this whole query
		// errors. Falling back to a plain select keeps the existing list
		// visible (with "—" for every project column) instead of the list
		// silently going empty, which would otherwise look like every
		// testimonial had vanished.
		console.error('[admin/testimonials] load with project join failed, retrying without it:', withProjectError.message);
		const { data: plain, error: plainError } = await supabase.from('testimonials').select('*').order('display_order');
		if (plainError) console.error('[admin/testimonials] plain load also failed:', plainError.message);
		rows = (plain ?? []).map((t) => ({ ...t, project_title: '—' }));
	} else {
		// Flattened for AdminTable, which only reads top-level row[col.key] —
		// no nested-path support.
		rows = (withProject ?? []).map((t) => ({ ...t, project_title: t.project?.title || '—' }));
	}

	return { testimonials: rows };
};

export const actions: Actions = {
	delete: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		if (!id) return fail(400, { error: 'ID tidak valid.' });

		const { data: deleted, error } = await supabase
			.from('testimonials')
			.delete()
			.eq('id', id)
			.select('display_order')
			.single();
		if (error) return fail(400, { error: error.message });

		if (deleted) {
			const { error: compactError } = await compactAfterDelete(supabase, 'testimonials', deleted.display_order);
			if (compactError) console.error('[admin/testimonials] compact failed:', compactError.message);
		}

		return { success: true };
	},

	reorder: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		const newOrder = Number(formData.get('display_order'));
		if (!id || Number.isNaN(newOrder)) return fail(400, { error: 'Data tidak valid.' });

		const { error } = await reorderRow(supabase, 'testimonials', id, newOrder);
		if (error) return fail(400, { error: friendlyDbError(error) });

		return { success: true };
	}
};
