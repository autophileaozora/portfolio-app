import { error, fail, redirect } from '@sveltejs/kit';
import { statSchema } from '$lib/validation/schemas';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals: { supabase } }) => {
	const { data: stat, error: statError } = await supabase
		.from('stats')
		.select('*')
		.eq('id', params.id)
		.single();

	if (!stat) {
		if (statError) console.error('[admin/stats/[id]] load failed:', statError.message);
		error(404, 'Stat not found');
	}

	return { stat };
};

export const actions: Actions = {
	default: async ({ params, request, locals: { supabase } }) => {
		const formData = await request.formData();
		const raw = {
			label: formData.get('label'),
			value: formData.get('value'),
			display_order: formData.get('display_order')
		};

		const parsed = statSchema.safeParse(raw);
		if (!parsed.success) {
			return fail(400, {
				error: 'Periksa kembali isian.',
				values: raw,
				fieldErrors: parsed.error.flatten().fieldErrors
			});
		}

		const { error: updateError } = await supabase.from('stats').update(parsed.data).eq('id', params.id);
		if (updateError) return fail(400, { error: updateError.message, values: raw });

		redirect(303, '/admin/stats');
	}
};
