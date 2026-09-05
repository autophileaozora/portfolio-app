import { error, fail, redirect } from '@sveltejs/kit';
import { testimonialSchema } from '$lib/validation/schemas';
import { friendlyDbError } from '$lib/server/adminErrors';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals: { supabase } }) => {
	const { data: testimonial, error: testimonialError } = await supabase
		.from('testimonials')
		.select('*')
		.eq('id', params.id)
		.single();

	if (!testimonial) {
		if (testimonialError) console.error('[admin/testimonials/[id]] load failed:', testimonialError.message);
		error(404, 'Testimonial not found');
	}

	return { testimonial };
};

export const actions: Actions = {
	default: async ({ params, request, locals: { supabase } }) => {
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

		const { error: updateError } = await supabase.from('testimonials').update(parsed.data).eq('id', params.id);
		if (updateError) return fail(400, { error: friendlyDbError(updateError), values: raw });

		redirect(303, '/admin/testimonials');
	}
};
