import { fail } from '@sveltejs/kit';
import { profileSchema } from '$lib/validation/schemas';
import { friendlyDbError } from '$lib/server/adminErrors';
import { resolveFileField } from '$lib/server/uploads';
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

		const { data: current } = await supabase
			.from('profile')
			.select('avatar_url, cv_url, resume_url')
			.eq('id', 1)
			.single();

		let avatar_url: string | null, cv_url: string | null, resume_url: string | null;
		try {
			avatar_url = await resolveFileField(supabase, formData, 'avatar_url', current?.avatar_url ?? null, 'avatars');
			cv_url = await resolveFileField(supabase, formData, 'cv_url', current?.cv_url ?? null, 'documents');
			resume_url = await resolveFileField(
				supabase,
				formData,
				'resume_url',
				current?.resume_url ?? null,
				'documents'
			);
		} catch (e) {
			return fail(400, { error: e instanceof Error ? e.message : 'Upload gagal.' });
		}

		const raw = {
			full_name: formData.get('full_name'),
			title: formData.get('title'),
			location: formData.get('location'),
			avatar_url,
			email: formData.get('email'),
			social_linkedin: formData.get('social_linkedin'),
			social_github: formData.get('social_github'),
			social_instagram: formData.get('social_instagram'),
			social_whatsapp: formData.get('social_whatsapp'),
			cv_url,
			resume_url,
			summary_paragraph: formData.get('summary_paragraph'),
			availability_text: formData.get('availability_text'),
			connect_text: formData.get('connect_text'),
			footer_copyright: formData.get('footer_copyright')
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
