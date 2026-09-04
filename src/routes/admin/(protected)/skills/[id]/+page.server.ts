import { error, fail, redirect } from '@sveltejs/kit';
import { skillSchema } from '$lib/validation/schemas';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals: { supabase } }) => {
	const { data: skill, error: skillError } = await supabase
		.from('skills')
		.select('*')
		.eq('id', params.id)
		.single();

	if (!skill) {
		if (skillError) console.error('[admin/skills/[id]] load failed:', skillError.message);
		error(404, 'Skill not found');
	}

	return { skill };
};

export const actions: Actions = {
	default: async ({ params, request, locals: { supabase } }) => {
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

		const { error: updateError } = await supabase.from('skills').update(parsed.data).eq('id', params.id);
		if (updateError) return fail(400, { error: updateError.message, values: raw });

		redirect(303, '/admin/skills');
	}
};
