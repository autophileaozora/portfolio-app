import { fail, redirect } from '@sveltejs/kit';
import { experienceSchema } from '$lib/validation/schemas';
import { friendlyDbError } from '$lib/server/adminErrors';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const raw = {
			role_title: formData.get('role_title'),
			role_type: formData.get('role_type'),
			company_name: formData.get('company_name'),
			date_start: formData.get('date_start'),
			date_end: formData.get('date_end'),
			display_order: formData.get('display_order')
		};

		const parsed = experienceSchema.safeParse(raw);
		if (!parsed.success) {
			return fail(400, {
				error: 'Periksa kembali isian.',
				values: raw,
				fieldErrors: parsed.error.flatten().fieldErrors
			});
		}

		const { error } = await supabase.from('experience').insert(parsed.data);
		if (error) return fail(400, { error: friendlyDbError(error), values: raw });

		redirect(303, '/admin/experience');
	}
};
