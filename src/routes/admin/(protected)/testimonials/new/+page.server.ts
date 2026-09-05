import { fail, redirect } from '@sveltejs/kit';
import { testimonialSchema } from '$lib/validation/schemas';
import { friendlyDbError } from '$lib/server/adminErrors';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const raw = {
			author_name: formData.get('author_name'),
			author_role: formData.get('author_role'),
			quote: formData.get('quote'),
			is_published: formData.get('is_published') === 'on',
			display_order: formData.get('display_order')
		};

		const parsed = testimonialSchema.safeParse(raw);
		if (!parsed.success) {
			return fail(400, {
				error: 'Periksa kembali isian.',
				values: raw,
				fieldErrors: parsed.error.flatten().fieldErrors
			});
		}

		const { error } = await supabase.from('testimonials').insert(parsed.data);
		if (error) return fail(400, { error: friendlyDbError(error), values: raw });

		redirect(303, '/admin/testimonials');
	}
};
