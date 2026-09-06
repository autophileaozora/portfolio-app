import { fail } from '@sveltejs/kit';
import { seoSettingsSchema } from '$lib/validation/schemas';
import { friendlyDbError } from '$lib/server/adminErrors';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const { data: seoSettings, error: seoError } = await supabase
		.from('seo_settings')
		.select('*')
		.eq('id', 1)
		.single();

	if (seoError) console.error('[admin/seo] load failed:', seoError.message);

	return { seoSettings: seoSettings ?? {} };
};

export const actions: Actions = {
	default: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();

		// favicon_url/og_image_url arrive pre-resolved to public URL
		// strings — the browser either uploads a new file directly to
		// Supabase Storage before submitting, or leaves the existing URL
		// untouched (see AdminForm.svelte), so there's no File/fallback
		// logic here.
		const raw = {
			site_name: formData.get('site_name'),
			favicon_url: formData.get('favicon_url'),
			og_image_url: formData.get('og_image_url'),
			google_site_verification: formData.get('google_site_verification')
		};

		const parsed = seoSettingsSchema.safeParse(raw);
		if (!parsed.success) {
			return fail(400, {
				error: 'Periksa kembali isian.',
				values: raw,
				fieldErrors: parsed.error.flatten().fieldErrors
			});
		}

		const { error } = await supabase.from('seo_settings').update(parsed.data).eq('id', 1);
		if (error) return fail(400, { error: friendlyDbError(error), values: raw });

		return { success: true, values: raw };
	}
};
