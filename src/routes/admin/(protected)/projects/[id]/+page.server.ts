import { error, fail, redirect } from '@sveltejs/kit';
import { projectSchema } from '$lib/validation/schemas';
import { friendlyDbError } from '$lib/server/adminErrors';
import { parseTagsInput, syncProjectTags } from '$lib/server/tags';
import type { Actions, PageServerLoad } from './$types';

const BUCKET = 'public-assets';

export const load: PageServerLoad = async ({ params, locals: { supabase } }) => {
	const { data: project, error: projectError } = await supabase
		.from('projects')
		.select('*, project_tags(tags(label))')
		.eq('id', params.id)
		.single();

	if (!project) {
		if (projectError) console.error('[admin/projects/[id]] load failed:', projectError.message);
		error(404, 'Project not found');
	}

	const tagsText = (project.project_tags ?? [])
		.map((pt) => pt.tags?.label)
		.filter(Boolean)
		.join(', ');

	return { project, tagsText };
};

export const actions: Actions = {
	default: async ({ params, request, locals: { supabase } }) => {
		const formData = await request.formData();

		const { data: current } = await supabase
			.from('projects')
			.select('thumbnail_url')
			.eq('id', params.id)
			.single();

		let thumbnail_url = current?.thumbnail_url ?? null;
		const file = formData.get('thumbnail_url');
		if (file instanceof File && file.size > 0) {
			const ext = file.name.split('.').pop() || 'bin';
			const path = `thumbnails/${crypto.randomUUID()}.${ext}`;
			const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
			if (uploadError) return fail(400, { error: `Gagal unggah thumbnail: ${uploadError.message}` });
			thumbnail_url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
		}

		const raw = {
			slug: formData.get('slug'),
			title: formData.get('title'),
			short_description: formData.get('short_description'),
			role: formData.get('role'),
			duration: formData.get('duration'),
			category: formData.get('category'),
			thumbnail_url,
			contributors: formData.get('contributors'),
			associated_with: formData.get('associated_with'),
			date_start: formData.get('date_start'),
			date_end: formData.get('date_end'),
			live_url: formData.get('live_url'),
			is_published: formData.get('is_published') === 'on',
			is_featured: formData.get('is_featured') === 'on'
		};

		const parsed = projectSchema.safeParse(raw);
		if (!parsed.success) {
			return fail(400, {
				error: 'Periksa kembali isian.',
				values: raw,
				fieldErrors: parsed.error.flatten().fieldErrors
			});
		}

		const { error: updateError } = await supabase.from('projects').update(parsed.data).eq('id', params.id);
		if (updateError) return fail(400, { error: friendlyDbError(updateError), values: raw });

		try {
			const tagsRaw = String(formData.get('tags') ?? '');
			await syncProjectTags(supabase, params.id, parseTagsInput(tagsRaw));
		} catch (e) {
			console.error('[admin/projects/[id]] tag sync failed:', e instanceof Error ? e.message : e);
		}

		redirect(303, `/admin/projects/${params.id}`);
	}
};
