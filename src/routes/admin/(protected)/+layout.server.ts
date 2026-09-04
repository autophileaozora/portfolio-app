import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { safeGetSession }, setHeaders }) => {
	const { user } = await safeGetSession();
	if (!user) redirect(303, '/admin/login');

	setHeaders({ 'cache-control': 'no-store' });

	return { user: { email: user.email } };
};
