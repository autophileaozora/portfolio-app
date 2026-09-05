import { fail, redirect } from '@sveltejs/kit';
import { experienceSchema } from '$lib/validation/schemas';
import { friendlyDbError } from '$lib/server/adminErrors';
import { nextDisplayOrder } from '$lib/server/ranked';
import { resolveFileField } from '$lib/server/uploads';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();

		let image_url: string | null;
		try {
			image_url = await resolveFileField(supabase, formData, 'image_url', null, 'experience');
		} catch (e) {
			return fail(400, { error: e instanceof Error ? e.message : 'Upload gagal.' });
		}

		const raw = {
			role_title: formData.get('role_title'),
			role_type: formData.get('role_type'),
			company_name: formData.get('company_name'),
			date_start: formData.get('date_start'),
			date_end: formData.get('date_end'),
			image_url
		};

		const parsed = experienceSchema.safeParse(raw);
		if (!parsed.success) {
			return fail(400, {
				error: 'Periksa kembali isian.',
				values: raw,
				fieldErrors: parsed.error.flatten().fieldErrors
			});
		}

		const display_order = await nextDisplayOrder(supabase, 'experience');
		const { error } = await supabase.from('experience').insert({ ...parsed.data, display_order });
		if (error) return fail(400, { error: friendlyDbError(error), values: raw });

		redirect(303, '/admin/experience');
	}
};
