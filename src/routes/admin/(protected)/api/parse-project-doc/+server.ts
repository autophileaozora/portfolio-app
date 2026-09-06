import { error, json } from '@sveltejs/kit';
import mammoth from 'mammoth';
import { parseProjectDoc } from '$lib/server/parseProjectDoc';
import type { RequestHandler } from './$types';

/**
 * pdfjs-dist directly (text extraction only), NOT the `pdf-parse` package
 * — pdf-parse v2 pulls in `@napi-rs/canvas` (a native compiled binary) as
 * a hard top-level dependency, which crashed this endpoint's Vercel
 * Serverless Function at cold start (worked fine in local `vite preview`,
 * 500'd in production — a classic native-addon-vs-serverless-bundler
 * mismatch). pdfjs-dist only reaches for that same native package lazily,
 * wrapped in its own try/catch, and only for canvas-rendering APIs this
 * text-only path never calls.
 */
async function extractPdfText(buffer: Buffer): Promise<string> {
	const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
	const doc = await getDocument({
		data: new Uint8Array(buffer),
		useWorkerFetch: false,
		isEvalSupported: false
	}).promise;

	let text = '';
	for (let i = 1; i <= doc.numPages; i++) {
		const page = await doc.getPage(i);
		const content = await page.getTextContent();
		for (const item of content.items) {
			// TextContent items are a TextItem | TextMarkedContent union —
			// only TextItem carries `str`/`hasEOL`.
			if ('str' in item) {
				// hasEOL marks a line break after this run — PDF text has no
				// inherent newlines (it's positioned by x/y, not characters),
				// so without this every line would run together on one line
				// and the heading-per-line parser in parseProjectDoc.ts would
				// never recognize anything.
				text += item.str + (item.hasEOL ? '\n' : ' ');
			}
		}
		text += '\n';
	}
	return text;
}

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
			plainText = await extractPdfText(buffer);
		}
	} catch (e) {
		error(400, `Gagal membaca dokumen: ${e instanceof Error ? e.message : 'unknown error'}`);
	}

	const { fields, warnings } = parseProjectDoc({ html, plainText });
	return json({ fields, warnings });
};
