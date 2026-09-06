import { fail, redirect } from '@sveltejs/kit';
import { skillSchema } from '$lib/validation/schemas';
import { friendlyDbError } from '$lib/server/adminErrors';
import { nextDisplayOrder } from '$lib/server/ranked';
import { recomputeAutoStats } from '$lib/server/autoStats';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const raw = { name: formData.get('name') };

		const parsed = skillSchema.safeParse(raw);
		if (!parsed.success) {
			return fail(400, {
				error: 'Periksa kembali isian.',
				values: raw,
				fieldErrors: parsed.error.flatten().fieldErrors
			});
		}

		const display_order = await nextDisplayOrder(supabase, 'skills');
		const { error } = await supabase.from('skills').insert({ ...parsed.data, display_order });
		if (error) return fail(400, { error: friendlyDbError(error), values: raw });

		await recomputeAutoStats(supabase);

		redirect(303, '/admin/skills');
	}
};
