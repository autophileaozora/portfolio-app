import { error, fail } from '@sveltejs/kit';
import { friendlyDbError } from '$lib/server/adminErrors';
import { reorderSection, compactSectionsAfterDelete } from '$lib/server/ranked';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals: { supabase } }) => {
	const { data: project, error: projectError } = await supabase
		.from('projects')
		.select('id, title')
		.eq('id', params.id)
		.single();

	if (!project) {
		if (projectError) console.error('[admin/projects/[id]/sections] project load failed:', projectError.message);
		error(404, 'Project not found');
	}

	const { data: sections, error: sectionsError } = await supabase
		.from('project_sections')
		.select('*')
		.eq('project_id', params.id)
		.order('type')
		.order('display_order');

	if (sectionsError) console.error('[admin/projects/[id]/sections] sections load failed:', sectionsError.message);

	return { project, sections: sections ?? [] };
};

export const actions: Actions = {
	delete: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		if (!id) return fail(400, { error: 'ID tidak valid.' });

		const { data: deleted, error: deleteError } = await supabase
			.from('project_sections')
			.delete()
			.eq('id', id)
			.select('project_id, type, display_order')
			.single();
		if (deleteError) return fail(400, { error: deleteError.message });

		if (deleted) {
			const { error: compactError } = await compactSectionsAfterDelete(
				supabase,
				deleted.project_id,
				deleted.type,
				deleted.display_order
			);
			if (compactError) console.error('[admin/projects/[id]/sections] compact failed:', compactError.message);
		}

		return { success: true };
	},

	reorder: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		const newOrder = Number(formData.get('display_order'));
		if (!id || Number.isNaN(newOrder)) return fail(400, { error: 'Data tidak valid.' });

		const { error } = await reorderSection(supabase, id, newOrder);
		if (error) return fail(400, { error: friendlyDbError(error) });

		return { success: true };
	}
};
