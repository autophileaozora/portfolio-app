import { fail, redirect } from '@sveltejs/kit';
import { skillSchema } from '$lib/validation/schemas';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const raw = {
			name: formData.get('name'),
			display_order: formData.get('display_order')
		};

		const parsed = skillSchema.safeParse(raw);
		if (!parsed.success) {
			return fail(400, {
				error: 'Periksa kembali isian.',
				values: raw,
				fieldErrors: parsed.error.flatten().fieldErrors
			});
		}

		const { error } = await supabase.from('skills').insert(parsed.data);
		if (error) return fail(400, { error: error.message, values: raw });

		redirect(303, '/admin/skills');
	}
};
