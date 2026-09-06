import { error, fail, redirect } from '@sveltejs/kit';
import { experienceSchema } from '$lib/validation/schemas';
import { friendlyDbError } from '$lib/server/adminErrors';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals: { supabase } }) => {
	const { data: item, error: itemError } = await supabase
		.from('experience')
		.select('*')
		.eq('id', params.id)
		.single();

	if (!item) {
		if (itemError) console.error('[admin/experience/[id]] load failed:', itemError.message);
		error(404, 'Experience not found');
	}

	return { item };
};

export const actions: Actions = {
	default: async ({ params, request, locals: { supabase } }) => {
		const formData = await request.formData();

		// image_url arrives pre-resolved to a public URL string — the browser
		// either uploads a new file directly to Supabase Storage before
		// submitting, or leaves the existing URL untouched (see
		// AdminForm.svelte), so there's no File/fallback logic here.
		const raw = {
			role_title: formData.get('role_title'),
			role_type: formData.get('role_type'),
			company_name: formData.get('company_name'),
			date_start: formData.get('date_start'),
			date_end: formData.get('date_end'),
			image_url: formData.get('image_url')
		};

		const parsed = experienceSchema.safeParse(raw);
		if (!parsed.success) {
			return fail(400, {
				error: 'Periksa kembali isian.',
				values: raw,
				fieldErrors: parsed.error.flatten().fieldErrors
			});
		}

		const { error: updateError } = await supabase.from('experience').update(parsed.data).eq('id', params.id);
		if (updateError) return fail(400, { error: friendlyDbError(updateError), values: raw });

		redirect(303, '/admin/experience');
	}
};
