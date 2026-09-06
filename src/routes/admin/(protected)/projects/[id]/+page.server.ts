import { error, fail, redirect } from '@sveltejs/kit';
import { projectSchema } from '$lib/validation/schemas';
import { friendlyDbError } from '$lib/server/adminErrors';
import { parseTagsInput, syncProjectTags } from '$lib/server/tags';
import type { Actions, PageServerLoad } from './$types';

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

	const { count: pendingEditRequestCount } = await supabase
		.from('project_edit_requests')
		.select('*', { count: 'exact', head: true })
		.eq('project_id', params.id)
		.eq('status', 'pending');

	return { project, tagsText, pendingEditRequestCount: pendingEditRequestCount ?? 0 };
};

export const actions: Actions = {
	default: async ({ params, request, locals: { supabase } }) => {
		const formData = await request.formData();

		// thumbnail_url arrives pre-resolved to a public URL string — the
		// browser either uploads a new file directly to Supabase Storage
		// before submitting, or leaves the existing URL untouched
		// (see AdminForm.svelte), so there's no File/fallback logic here.
		const raw = {
			slug: formData.get('slug'),
			title: formData.get('title'),
			short_description: formData.get('short_description'),
			role: formData.get('role'),
			category: formData.get('category'),
			thumbnail_url: formData.get('thumbnail_url'),
			contributors_list: formData.get('contributors_list'),
			associated_with: formData.get('associated_with'),
			date_start: formData.get('date_start'),
			date_end: formData.get('date_end'),
			live_url: formData.get('live_url'),
			meta_title: formData.get('meta_title'),
			meta_description: formData.get('meta_description'),
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
