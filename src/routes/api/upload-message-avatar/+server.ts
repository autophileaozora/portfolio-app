import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const BUCKET = 'public-assets';
// Hardcoded, not client-selectable — this is what lets the anon storage
// RLS policy (see the migration) scope write access to just this one
// prefix instead of the whole bucket.
const FOLDER = 'message-avatars';
const ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

/**
 * Public sibling of /admin/api/upload-url — deliberately NOT gated behind
 * a session check, since anyone submitting a "Leave a Message" form needs
 * this for their optional photo. Same signed-URL shape (Vercel's 4.5MB
 * body cap applies here too), just for one fixed, narrowly-scoped folder
 * instead of an admin-chosen one.
 */
export const POST: RequestHandler = async ({ request, locals: { supabase } }) => {
	const { filename } = await request.json();
	const ext = String(filename ?? '')
		.split('.')
		.pop()
		?.toLowerCase();
	if (!ext || !ALLOWED_EXT.includes(ext)) error(400, 'Format gambar harus jpg, png, webp, atau gif.');

	const path = `${FOLDER}/${crypto.randomUUID()}.${ext}`;

	const { data, error: signError } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);
	if (signError || !data) error(500, signError?.message ?? 'Gagal menyiapkan upload.');

	const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

	return json({ signedUrl: data.signedUrl, publicUrl });
};
