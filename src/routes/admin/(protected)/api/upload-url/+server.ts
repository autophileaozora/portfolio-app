import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const BUCKET = 'public-assets';
const ALLOWED_FOLDERS = ['thumbnails', 'sections', 'experience', 'avatars', 'documents', 'imports', 'branding'];

/**
 * Issues a signed Supabase Storage upload URL so the browser can PUT a
 * file straight to Supabase, bypassing the SvelteKit server action
 * entirely. Vercel Serverless Functions cap request bodies at 4.5MB —
 * routing image bytes through a form action hits that ceiling fast once
 * more than one photo (or a single large one) is involved. Only the
 * resulting public URL, a plain string, ever reaches a form action
 * afterward (see AdminForm.svelte).
 *
 * This is a raw +server.ts endpoint, so the (protected) route group's
 * +layout.server.ts guard (which only runs for page loads) does NOT
 * apply here — the session check below is this endpoint's only gate.
 */
export const POST: RequestHandler = async ({ request, locals: { supabase, safeGetSession } }) => {
	const { user } = await safeGetSession();
	if (!user) error(401, 'Unauthorized');

	const { folder, filename } = await request.json();
	if (!ALLOWED_FOLDERS.includes(folder)) error(400, 'Folder tidak valid.');

	const ext = String(filename ?? '').split('.').pop() || 'bin';
	const path = `${folder}/${crypto.randomUUID()}.${ext}`;

	const { data, error: signError } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);
	if (signError || !data) error(500, signError?.message ?? 'Gagal membuat signed URL.');

	const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

	return json({ signedUrl: data.signedUrl, publicUrl });
};
