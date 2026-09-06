import { error, fail } from '@sveltejs/kit';
import {
	editRequestGateSchema,
	projectPublicEditSchema,
	documentationSlidesSchema
} from '$lib/validation/schemas';
import { parseTagsInput } from '$lib/server/tags';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals: { supabase } }) => {
	const { data: project, error: projectError } = await supabase
		.from('projects')
		.select('*, project_tags(tags(label))')
		.eq('slug', params.slug)
		.eq('is_published', true)
		.single();

	if (!project) {
		if (projectError) console.error(`[request-edit/${params.slug}] load failed:`, projectError.message);
		error(404, 'Project not found');
	}

	const tagsText = (project.project_tags ?? [])
		.map((pt) => pt.tags?.label)
		.filter(Boolean)
		.join(', ');

	const { data: documentationSections } = await supabase
		.from('project_sections')
		.select('title, content, image_url')
		.eq('project_id', project.id)
		.eq('type', 'documentation')
		.order('display_order');

	return { project, tagsText, documentationSlides: documentationSections ?? [] };
};

export const actions: Actions = {
	default: async ({ params, request, locals: { supabase } }) => {
		const formData = await request.formData();

		const gateRaw = {
			requester_name: formData.get('requester_name'),
			requester_instagram: formData.get('requester_instagram'),
			requester_whatsapp: formData.get('requester_whatsapp')
		};
		const projectRaw = {
			title: formData.get('title'),
			short_description: formData.get('short_description'),
			role: formData.get('role'),
			category: formData.get('category'),
			thumbnail_url: formData.get('thumbnail_url'),
			contributors_list: formData.get('contributors_list'),
			associated_with: formData.get('associated_with'),
			date_start: formData.get('date_start'),
			date_end: formData.get('date_end'),
			live_url: formData.get('live_url')
			// meta_title/meta_description deliberately not read here — SEO stays
			// admin-only (projectPublicEditSchema omits them regardless, but
			// there's no reason to even collect them from a public submission).
		};

		const gateParsed = editRequestGateSchema.safeParse(gateRaw);
		const projectParsed = projectPublicEditSchema.safeParse(projectRaw);
		const slidesParsed = documentationSlidesSchema.safeParse(formData.get('documentation_slides'));

		if (!gateParsed.success || !projectParsed.success || !slidesParsed.success) {
			return fail(400, {
				error: 'Periksa kembali isian.',
				values: { ...gateRaw, ...projectRaw },
				fieldErrors: {
					...(gateParsed.success ? {} : gateParsed.error.flatten().fieldErrors),
					...(projectParsed.success ? {} : projectParsed.error.flatten().fieldErrors)
				}
			});
		}

		const { data: project } = await supabase.from('projects').select('id').eq('slug', params.slug).single();
		if (!project) {
			return fail(404, { error: 'Project tidak ditemukan.', values: { ...gateRaw, ...projectRaw } });
		}

		const tagsRaw = String(formData.get('tags') ?? '');
		const proposed_changes = {
			...projectParsed.data,
			tags: parseTagsInput(tagsRaw),
			documentation_slides: slidesParsed.data
		};

		const { error: insertError } = await supabase.from('project_edit_requests').insert({
			project_id: project.id,
			requester_name: gateParsed.data.requester_name,
			requester_instagram: gateParsed.data.requester_instagram,
			requester_whatsapp: gateParsed.data.requester_whatsapp,
			proposed_changes
		});
		if (insertError) {
			return fail(400, {
				error: insertError.message,
				values: { ...gateRaw, ...projectRaw }
			});
		}

		return { success: true };
	}
};
