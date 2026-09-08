import { fail } from '@sveltejs/kit';
import { messageSchema } from '$lib/validation/schemas';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const raw = {
			sender_name: formData.get('sender_name'),
			is_anonymous: formData.get('is_anonymous') === 'on',
			content: formData.get('content'),
			sender_avatar_url: formData.get('sender_avatar_url'),
			sender_instagram: formData.get('sender_instagram'),
			project_id: formData.get('project_id'),
			proposed_project_name: formData.get('proposed_project_name')
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
			content: parsed.data.content,
			// A photo/Instagram handle instantly de-anonymizes someone, so
			// these are dropped server-side too if is_anonymous slipped
			// through true anyway — not just hidden client-side. project_id
			// (an EXISTING project) is deliberately NOT cleared here: "I
			// worked with you on Project X" while staying anonymous is a
			// legitimate combination the user explicitly wants to allow —
			// only proposing a brand-new, unlisted project requires being
			// named (enforced by messageSchema's .refine(), not here).
			sender_avatar_url: parsed.data.is_anonymous ? null : parsed.data.sender_avatar_url,
			sender_instagram: parsed.data.is_anonymous ? null : parsed.data.sender_instagram,
			project_id: parsed.data.project_id || null,
			proposed_project_name: parsed.data.proposed_project_name || null
		});
		if (error) return fail(400, { error: error.message, values: raw });

		return { success: true };
	}
};
