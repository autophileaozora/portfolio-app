import { error, fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';

const replySchema = z.object({
	admin_reply: z.string().trim().min(1, 'Balasan tidak boleh kosong.').max(2000)
});

export const load: PageServerLoad = async ({ params, locals: { supabase } }) => {
	const { data: message, error: messageError } = await supabase
		.from('messages')
		.select('*')
		.eq('id', params.id)
		.single();

	if (!message) {
		if (messageError) console.error('[admin/messages/[id]] load failed:', messageError.message);
		error(404, 'Message not found');
	}

	return { message };
};

export const actions: Actions = {
	default: async ({ params, request, locals: { supabase } }) => {
		const formData = await request.formData();
		const raw = { admin_reply: formData.get('admin_reply') };

		const parsed = replySchema.safeParse(raw);
		if (!parsed.success) {
			return fail(400, { error: parsed.error.issues[0]?.message ?? 'Periksa kembali isian.', values: raw });
		}

		const { error: updateError } = await supabase
			.from('messages')
			.update({
				admin_reply: parsed.data.admin_reply,
				status: 'answered',
				replied_at: new Date().toISOString()
			})
			.eq('id', params.id);
		if (updateError) return fail(400, { error: updateError.message, values: raw });

		redirect(303, '/admin/messages');
	}
};
