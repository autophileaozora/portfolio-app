import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { safeGetSession, supabase }, setHeaders }) => {
	const { user } = await safeGetSession();
	if (!user) redirect(303, '/admin/login');

	setHeaders({ 'cache-control': 'no-store' });

	const [{ count: pendingMessagesCount }, { count: pendingEditRequestsCount }] = await Promise.all([
		supabase.from('messages').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
		supabase.from('project_edit_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending')
	]);

	return {
		user: { email: user.email },
		pendingMessagesCount: pendingMessagesCount ?? 0,
		pendingEditRequestsCount: pendingEditRequestsCount ?? 0
	};
};
