import { error, fail, redirect } from '@sveltejs/kit';
import { sectionContentSchema } from '$lib/validation/schemas';
import { friendlyDbError } from '$lib/server/adminErrors';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals: { supabase } }) => {
	const { data: section, error: sectionError } = await supabase
		.from('project_sections')
		.select('*')
		.eq('id', params.sectionId)
		.eq('project_id', params.id)
		.single();

	if (!section) {
		if (sectionError) console.error('[admin/projects/[id]/sections/[sectionId]] load failed:', sectionError.message);
		error(404, 'Section not found');
	}

	return { section };
};

export const actions: Actions = {
	default: async ({ params, request, locals: { supabase } }) => {
		const formData = await request.formData();
		const raw = {
			title: formData.get('title'),
			content: formData.get('content')
		};

		const parsed = sectionContentSchema.safeParse(raw);
		if (!parsed.success) {
			return fail(400, {
				error: 'Periksa kembali isian.',
				values: raw,
				fieldErrors: parsed.error.flatten().fieldErrors
			});
		}

		const { error: updateError } = await supabase
			.from('project_sections')
			.update(parsed.data)
			.eq('id', params.sectionId);
		if (updateError) return fail(400, { error: friendlyDbError(updateError), values: raw });

		redirect(303, `/admin/projects/${params.id}/sections`);
	}
};
