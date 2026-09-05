import { fail } from '@sveltejs/kit';
import { profileSchema } from '$lib/validation/schemas';
import { friendlyDbError } from '$lib/server/adminErrors';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const { data: profile, error: profileError } = await supabase
		.from('profile')
		.select('*')
		.eq('id', 1)
		.single();

	if (profileError) console.error('[admin/profile] load failed:', profileError.message);

	return { profile: profile ?? {} };
};

export const actions: Actions = {
	default: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const raw = {
			full_name: formData.get('full_name'),
			title: formData.get('title'),
			location: formData.get('location'),
			avatar_url: formData.get('avatar_url'),
			email: formData.get('email'),
			social_linkedin: formData.get('social_linkedin'),
			social_github: formData.get('social_github'),
			social_instagram: formData.get('social_instagram'),
			social_whatsapp: formData.get('social_whatsapp'),
			cv_url: formData.get('cv_url'),
			resume_url: formData.get('resume_url'),
			summary_paragraph: formData.get('summary_paragraph')
		};

		const parsed = profileSchema.safeParse(raw);
		if (!parsed.success) {
			return fail(400, {
				error: 'Periksa kembali isian.',
				values: raw,
				fieldErrors: parsed.error.flatten().fieldErrors
			});
		}

		const { error } = await supabase.from('profile').update(parsed.data).eq('id', 1);
		if (error) return fail(400, { error: friendlyDbError(error), values: raw });

		return { success: true, values: raw };
	}
};
