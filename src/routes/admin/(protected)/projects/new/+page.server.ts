import { fail, redirect } from '@sveltejs/kit';
import { projectSchema, newProjectSectionsSchema } from '$lib/validation/schemas';
import { friendlyDbError } from '$lib/server/adminErrors';
import { nextDisplayOrder } from '$lib/server/ranked';
import { parseTagsInput, syncProjectTags } from '$lib/server/tags';
import { resolveFileField, uploadFile } from '$lib/server/uploads';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();

		let thumbnail_url: string | null;
		try {
			thumbnail_url = await resolveFileField(supabase, formData, 'thumbnail_url', null, 'thumbnails');
		} catch (e) {
			return fail(400, { error: e instanceof Error ? e.message : 'Upload gagal.' });
		}

		const raw = {
			slug: formData.get('slug'),
			title: formData.get('title'),
			short_description: formData.get('short_description'),
			role: formData.get('role'),
			category: formData.get('category'),
			thumbnail_url,
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

		const display_order = await nextDisplayOrder(supabase, 'projects');
		const { data: inserted, error } = await supabase
			.from('projects')
			.insert({ ...parsed.data, display_order })
			.select('id')
			.single();
		if (error) return fail(400, { error: friendlyDbError(error), values: raw });

		try {
			const tagsRaw = String(formData.get('tags') ?? '');
			await syncProjectTags(supabase, inserted.id, parseTagsInput(tagsRaw));
		} catch (e) {
			console.error('[admin/projects/new] tag sync failed:', e instanceof Error ? e.message : e);
		}

		const sectionsParsed = newProjectSectionsSchema.safeParse(formData.get('sections'));
		if (sectionsParsed.success && sectionsParsed.data.length) {
			// Fresh project, no existing sections — order per (type) can just be
			// counted in-memory here instead of round-tripping nextSectionOrder.
			const orderByType: Record<string, number> = {};
			const rows = await Promise.all(
				sectionsParsed.data.map(async (row) => {
					let image_url: string | null = null;
					const file = formData.get(`sections__${row._rowId}__image_file`);
					if (file instanceof File && file.size > 0) {
						try {
							image_url = await uploadFile(supabase, file, 'sections');
						} catch (e) {
							console.error(
								'[admin/projects/new] section image upload failed:',
								e instanceof Error ? e.message : e
							);
						}
					}
					orderByType[row.type] = (orderByType[row.type] ?? 0) + 1;
					return {
						project_id: inserted.id,
						type: row.type,
						title: row.title,
						content: row.content,
						image_url,
						display_order: orderByType[row.type]
					};
				})
			);
			const { error: sectionsError } = await supabase.from('project_sections').insert(rows);
			if (sectionsError) {
				console.error('[admin/projects/new] section insert failed:', sectionsError.message);
			}
		}

		redirect(303, `/admin/projects/${inserted.id}`);
	}
};
