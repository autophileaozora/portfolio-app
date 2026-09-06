import { error, json } from '@sveltejs/kit';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import { parseProjectDoc } from '$lib/server/parseProjectDoc';
import type { RequestHandler } from './$types';

/**
 * Extracts wizard fields from a project write-up the admin already
 * uploaded to Storage (see /admin/api/upload-url, folder 'imports') —
 * this endpoint takes the resulting URL, not the file itself, so a
 * document with several embedded screenshots doesn't have to pass
 * through this request body at all (the same 4.5MB Vercel Serverless
 * Function limit that forced images onto the signed-URL path applies
 * here too; fetching the file server-to-server isn't subject to it).
 *
 * A raw +server.ts route isn't covered by the (protected) layout's
 * load-based guard, so the session check below is this endpoint's only
 * gate, same as upload-url.
 */
export const POST: RequestHandler = async ({ request, locals: { safeGetSession } }) => {
	const { user } = await safeGetSession();
	if (!user) error(401, 'Unauthorized');

	const { url, filename } = await request.json();
	if (!url || typeof url !== 'string') error(400, 'URL dokumen tidak valid.');

	const ext = String(filename ?? '')
		.split('.')
		.pop()
		?.toLowerCase();
	if (ext !== 'docx' && ext !== 'pdf') error(400, 'Format file harus .docx atau .pdf.');

	const fileRes = await fetch(url);
	if (!fileRes.ok) error(400, 'Gagal mengambil file dokumen dari storage.');
	const buffer = Buffer.from(await fileRes.arrayBuffer());

	let html: string | undefined;
	let plainText: string | undefined;
	try {
		if (ext === 'docx') {
			const result = await mammoth.convertToHtml({ buffer });
			html = result.value;
		} else {
			const parser = new PDFParse({ data: buffer });
			const result = await parser.getText();
			plainText = result.text;
		}
	} catch (e) {
		error(400, `Gagal membaca dokumen: ${e instanceof Error ? e.message : 'unknown error'}`);
	}

	const { fields, warnings } = parseProjectDoc({ html, plainText });
	return json({ fields, warnings });
};
