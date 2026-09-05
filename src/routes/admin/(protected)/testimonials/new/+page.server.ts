import { fail, redirect } from '@sveltejs/kit';
import { testimonialSchema } from '$lib/validation/schemas';
import { friendlyDbError } from '$lib/server/adminErrors';
import { nextDisplayOrder } from '$lib/server/ranked';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const raw = {
			author_name: formData.get('author_name'),
			author_role: formData.get('author_role'),
			quote: formData.get('quote'),
			is_published: formData.get('is_published') === 'on'
		};

		const parsed = testimonialSchema.safeParse(raw);
		if (!parsed.success) {
			return fail(400, {
				error: 'Periksa kembali isian.',
				values: raw,
				fieldErrors: parsed.error.flatten().fieldErrors
			});
		}

		const display_order = await nextDisplayOrder(supabase, 'testimonials');
		const { error } = await supabase.from('testimonials').insert({ ...parsed.data, display_order });
		if (error) return fail(400, { error: friendlyDbError(error), values: raw });

		redirect(303, '/admin/testimonials');
	}
};
