import { fail, redirect } from '@sveltejs/kit';
import { statSchema } from '$lib/validation/schemas';
import { friendlyDbError } from '$lib/server/adminErrors';
import { nextDisplayOrder } from '$lib/server/ranked';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const raw = { label: formData.get('label'), value: formData.get('value') };

		const parsed = statSchema.safeParse(raw);
		if (!parsed.success) {
			return fail(400, {
				error: 'Periksa kembali isian.',
				values: raw,
				fieldErrors: parsed.error.flatten().fieldErrors
			});
		}

		const display_order = await nextDisplayOrder(supabase, 'stats');
		const { error } = await supabase.from('stats').insert({ ...parsed.data, display_order });
		if (error) return fail(400, { error: friendlyDbError(error), values: raw });

		redirect(303, '/admin/stats');
	}
};
