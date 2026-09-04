import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const { data: skills, error: skillsError } = await supabase
		.from('skills')
		.select('*')
		.order('display_order');

	if (skillsError) console.error('[admin/skills] load failed:', skillsError.message);

	return { skills: skills ?? [] };
};

export const actions: Actions = {
	delete: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		if (!id) return fail(400, { error: 'ID tidak valid.' });

		const { error } = await supabase.from('skills').delete().eq('id', id);
		if (error) return fail(400, { error: error.message });

		return { success: true };
	},

	reorder: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		const displayOrder = Number(formData.get('display_order'));
		if (!id || Number.isNaN(displayOrder)) return fail(400, { error: 'Data tidak valid.' });

		const { error } = await supabase.from('skills').update({ display_order: displayOrder }).eq('id', id);
		if (error) return fail(400, { error: error.message });

		return { success: true };
	}
};
