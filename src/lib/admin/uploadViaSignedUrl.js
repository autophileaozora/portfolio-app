import { PUBLIC_SUPABASE_PUBLISHABLE_KEY } from '$env/static/public';

/**
 * Uploads a file straight to Supabase Storage from the browser via a
 * signed URL (see /admin/api/upload-url), instead of routing the bytes
 * through a SvelteKit form action — Vercel Serverless Functions cap
 * request bodies at 4.5MB, easy to blow past with real photos. Returns
 * the file's final public URL, the only thing that ever reaches a form
 * action afterward.
 */
export async function uploadViaSignedUrl(file, folder) {
	const res = await fetch('/admin/api/upload-url', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ folder, filename: file.name })
	});
	if (!res.ok) throw new Error('Gagal menyiapkan upload.');
	const { signedUrl, publicUrl } = await res.json();

	const putRes = await fetch(signedUrl, {
		method: 'PUT',
		headers: {
			apikey: PUBLIC_SUPABASE_PUBLISHABLE_KEY,
			authorization: `Bearer ${PUBLIC_SUPABASE_PUBLISHABLE_KEY}`,
			'content-type': file.type || 'application/octet-stream',
			'x-upsert': 'true'
		},
		body: file
	});
	if (!putRes.ok) throw new Error('Gagal mengunggah file.');
	return publicUrl;
}
