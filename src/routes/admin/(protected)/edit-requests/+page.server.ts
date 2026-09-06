import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const { data: requests, error } = await supabase
		.from('project_edit_requests')
		.select('id, requester_name, requester_instagram, status, created_at, projects(title, slug)')
		.order('created_at', { ascending: false });

	if (error) console.error('[admin/edit-requests] load failed:', error.message);

	return { requests: requests ?? [] };
};
