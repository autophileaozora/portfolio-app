import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const { data: messages, error } = await supabase
		.from('messages')
		.select('*')
		.order('created_at', { ascending: false });

	if (error) console.error('[admin/messages] load failed:', error.message);

	return { messages: messages ?? [] };
};

export const actions: Actions = {
	delete: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		if (!id) return fail(400, { error: 'ID tidak valid.' });

		const { error } = await supabase.from('messages').delete().eq('id', id);
		if (error) return fail(400, { error: error.message });

		return { success: true };
	}
};
