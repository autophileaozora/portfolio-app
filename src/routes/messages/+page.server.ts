import { fail } from '@sveltejs/kit';
import { messageSchema } from '$lib/validation/schemas';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const raw = {
			sender_name: formData.get('sender_name'),
			is_anonymous: formData.get('is_anonymous') === 'on',
			content: formData.get('content')
		};

		const parsed = messageSchema.safeParse(raw);
		if (!parsed.success) {
			return fail(400, {
				error: parsed.error.issues[0]?.message ?? 'Periksa kembali isian.',
				values: raw
			});
		}

		/**
		 * No .select() here — anon can only SELECT status='answered' rows
		 * (see the RLS policy), and a fresh message is 'pending'. Chaining
		 * .select() makes PostgREST ask for the row back via RETURNING,
		 * which then fails RLS even though the INSERT itself is allowed
		 * (verified directly: identical request succeeds without .select()).
		 */
		const { error } = await supabase.from('messages').insert({
			sender_name: parsed.data.is_anonymous ? null : parsed.data.sender_name || null,
			is_anonymous: parsed.data.is_anonymous,
			content: parsed.data.content
		});
		if (error) return fail(400, { error: error.message, values: raw });

		return { success: true };
	}
};
