import { error, fail, redirect } from '@sveltejs/kit';
import { friendlyDbError } from '$lib/server/adminErrors';
import { syncProjectTags } from '$lib/server/tags';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals: { supabase } }) => {
	const { data: editRequest, error: reqError } = await supabase
		.from('project_edit_requests')
		.select('*, projects(*, project_tags(tags(label)))')
		.eq('id', params.id)
		.single();

	if (!editRequest) {
		if (reqError) console.error(`[admin/edit-requests/${params.id}] load failed:`, reqError.message);
		error(404, 'Edit request not found');
	}

	const { data: currentDocumentationSlides } = await supabase
		.from('project_sections')
		.select('title, content, image_url')
		.eq('project_id', editRequest.project_id)
		.eq('type', 'documentation')
		.order('display_order');

	return { editRequest, currentDocumentationSlides: currentDocumentationSlides ?? [] };
};

export const actions: Actions = {
	approve: async ({ params, locals: { supabase } }) => {
		const { data: editRequest, error: fetchError } = await supabase
			.from('project_edit_requests')
			.select('*')
			.eq('id', params.id)
			.single();
		if (fetchError || !editRequest) return fail(404, { error: 'Permintaan tidak ditemukan.' });
		if (editRequest.status !== 'pending') return fail(400, { error: 'Permintaan ini sudah direview.' });

		const proposed = editRequest.proposed_changes as Record<string, unknown>;
		const { tags, documentation_slides, ...projectFields } = proposed;

		const { error: updateError } = await supabase
			.from('projects')
			.update(projectFields)
			.eq('id', editRequest.project_id);
		if (updateError) return fail(400, { error: friendlyDbError(updateError) });

		if (Array.isArray(tags)) {
			try {
				await syncProjectTags(supabase, editRequest.project_id, tags);
			} catch (e) {
				console.error('[admin/edit-requests approve] tag sync failed:', e instanceof Error ? e.message : e);
			}
		}

		if (Array.isArray(documentation_slides)) {
			// Same "replace the whole set" strategy as syncProjectTags — the
			// proposed list is the full desired state, not a diff against
			// specific existing rows.
			const { error: deleteError } = await supabase
				.from('project_sections')
				.delete()
				.eq('project_id', editRequest.project_id)
				.eq('type', 'documentation');
			if (deleteError) {
				console.error('[admin/edit-requests approve] clearing old documentation slides failed:', deleteError.message);
			} else if (documentation_slides.length) {
				const rows = documentation_slides.map((slide, i) => ({
					project_id: editRequest.project_id,
					type: 'documentation',
					title: slide.title ?? '',
					content: slide.content ?? '',
					image_url: slide.image_url ?? null,
					display_order: i + 1
				}));
				const { error: insertError } = await supabase.from('project_sections').insert(rows);
				if (insertError) {
					console.error('[admin/edit-requests approve] inserting documentation slides failed:', insertError.message);
				}
			}
		}

		const { error: statusError } = await supabase
			.from('project_edit_requests')
			.update({ status: 'approved', reviewed_at: new Date().toISOString() })
			.eq('id', params.id);
		if (statusError) return fail(400, { error: friendlyDbError(statusError) });

		redirect(303, '/admin/edit-requests');
	},

	reject: async ({ params, request, locals: { supabase } }) => {
		const formData = await request.formData();
		const admin_note = String(formData.get('admin_note') ?? '').trim() || null;

		const { error: updateError } = await supabase
			.from('project_edit_requests')
			.update({ status: 'rejected', reviewed_at: new Date().toISOString(), admin_note })
			.eq('id', params.id);
		if (updateError) return fail(400, { error: friendlyDbError(updateError) });

		redirect(303, '/admin/edit-requests');
	}
};
