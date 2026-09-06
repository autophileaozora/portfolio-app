import { error, fail, redirect } from '@sveltejs/kit';
import { sectionSchema, SECTION_TYPES } from '$lib/validation/schemas';
import { friendlyDbError } from '$lib/server/adminErrors';
import { nextSectionOrder } from '$lib/server/ranked';
import { resolveFileField } from '$lib/server/uploads';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url, locals: { supabase } }) => {
	const type = url.searchParams.get('type');
	if (!type || !SECTION_TYPES.includes(type)) {
		error(400, 'Tipe section tidak valid.');
	}

	const { data: project, error: projectError } = await supabase
		.from('projects')
		.select('id, title')
		.eq('id', params.id)
		.single();

	if (!project) {
		if (projectError) console.error('[admin/projects/[id]/sections/new] load failed:', projectError.message);
		error(404, 'Project not found');
	}

	return { project, type };
};

export const actions: Actions = {
	default: async ({ params, request, locals: { supabase } }) => {
		const formData = await request.formData();

		let image_url: string | null;
		try {
			image_url = await resolveFileField(supabase, formData, 'image_url', null, 'sections');
		} catch (e) {
			return fail(400, { error: e instanceof Error ? e.message : 'Upload gagal.' });
		}

		const raw = {
			type: formData.get('type'),
			title: formData.get('title'),
			content: formData.get('content'),
			image_url
		};

		const parsed = sectionSchema.safeParse(raw);
		if (!parsed.success) {
			return fail(400, {
				error: 'Periksa kembali isian.',
				values: raw,
				fieldErrors: parsed.error.flatten().fieldErrors
			});
		}

		const display_order = await nextSectionOrder(supabase, params.id, parsed.data.type);
		const { error: insertError } = await supabase
			.from('project_sections')
			.insert({ ...parsed.data, project_id: params.id, display_order });
		if (insertError) return fail(400, { error: friendlyDbError(insertError), values: raw });

		redirect(303, `/admin/projects/${params.id}/sections`);
	}
};
