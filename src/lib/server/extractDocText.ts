import mammoth from 'mammoth';
import DOMMatrixPolyfill from 'dommatrix';
// A real, STATIC import (unlike pdf.js's own internal worker loading — see
// below) so Vercel's function bundler can actually trace and ship this
// file, instead of silently dropping it.
import * as pdfjsWorker from 'pdfjs-dist/legacy/build/pdf.worker.mjs';

/**
 * pdfjs-dist directly (text extraction only), NOT the `pdf-parse` package
 * — pdf-parse v2 pulls in `@napi-rs/canvas` (a native compiled binary) as
 * a hard top-level dependency, which crashed a Vercel Serverless Function
 * at cold start (worked fine in local `vite preview`, 500'd in production
 * — a classic native-addon-vs-serverless-bundler mismatch). pdfjs-dist
 * only reaches for that same native package lazily, wrapped in its own
 * try/catch, and only for canvas-rendering APIs this text-only path never
 * calls.
 *
 * pdfjs-dist's legacy build still has a bare `new DOMMatrix()` at its own
 * module top level (used for internal transform math), which throws
 * "DOMMatrix is not defined" the instant the module is imported in plain
 * Node — it normally expects either a real browser DOM or that same
 * canvas package to supply one. `dommatrix` is a tiny dependency-free
 * pure-JS shim for exactly this, so it's set on `globalThis` once, before
 * pdfjs-dist is ever imported, without pulling any native code back in.
 */
if (typeof globalThis.DOMMatrix === 'undefined') {
	globalThis.DOMMatrix = DOMMatrixPolyfill;
}

/**
 * In Node, pdfjs-dist runs its parsing on the "main thread" (no real Web
 * Worker) via a "fake worker" fallback — but that fallback still tries to
 * fetch the worker module's code by dynamically `import()`-ing whatever
 * string `GlobalWorkerOptions.workerSrc` happens to hold at the time
 * (defaults to the literal string `"./pdf.worker.mjs"`). Because that's a
 * *runtime string*, not a specifier a bundler can see ahead of time,
 * Vercel's function bundler never ships that file — the fake-worker
 * fallback then fails with "Cannot find module .../pdf.worker.mjs".
 * pdf.js itself provides the escape hatch: if `globalThis.pdfjsWorker` is
 * already set, it's used directly instead of ever attempting that dynamic
 * import — so importing the worker module ourselves, normally, and
 * registering it here avoids the whole problem.
 */
if (typeof globalThis.pdfjsWorker === 'undefined') {
	globalThis.pdfjsWorker = pdfjsWorker;
}

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
				// so without this every line would run together and the
				// heading-per-line parsers would never recognize anything.
				text += item.str + (item.hasEOL ? '\n' : ' ');
			}
		}
		text += '\n';
	}
	return text;
}

/**
 * Extracts either mammoth HTML (.docx) or flat text (.pdf) from an
 * uploaded document buffer — shared by every doc-import endpoint
 * (Projects, and the generic admin-doc importer for the other resources).
 */
export async function extractDocText(buffer: Buffer, ext: 'docx' | 'pdf'): Promise<{ html?: string; plainText?: string }> {
	if (ext === 'docx') {
		const result = await mammoth.convertToHtml({ buffer });
		return { html: result.value };
	}
	return { plainText: await extractPdfText(buffer) };
}
