import { fail } from '@sveltejs/kit';
import { friendlyDbError } from '$lib/server/adminErrors';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const { data: testimonials, error: testimonialsError } = await supabase
		.from('testimonials')
		.select('*')
		.order('display_order');

	if (testimonialsError) console.error('[admin/testimonials] load failed:', testimonialsError.message);

	return { testimonials: testimonials ?? [] };
};

export const actions: Actions = {
	delete: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		if (!id) return fail(400, { error: 'ID tidak valid.' });

		const { error } = await supabase.from('testimonials').delete().eq('id', id);
		if (error) return fail(400, { error: error.message });

		return { success: true };
	},

	reorder: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		const displayOrder = Number(formData.get('display_order'));
		if (!id || Number.isNaN(displayOrder)) return fail(400, { error: 'Data tidak valid.' });

		const { error } = await supabase.from('testimonials').update({ display_order: displayOrder }).eq('id', id);
		if (error) return fail(400, { error: friendlyDbError(error) });

		return { success: true };
	}
};
