import { error, json } from '@sveltejs/kit';
import { extractDocText } from '$lib/server/extractDocText';
import {
	parseExperienceDoc,
	parseExperienceBulkDoc,
	parseTestimonialDoc,
	parseStatDoc,
	parseProfileDoc,
	parseSkillsBulkDoc
} from '$lib/server/parseSimpleDoc';
import type { RequestHandler } from './$types';

/**
 * Generic sibling of /admin/api/parse-project-doc, for every resource
 * that isn't Projects — Testimonials/Stats/Profile each parse to one flat
 * record, Skills parses to a bulk list of names, Experience supports
 * both: `experience` (one record, used by the Tambah/Edit form) and
 * `experience-bulk` (many records from one document, used by the list
 * page's bulk-import). Same upload-then-parse shape: the client already
 * uploaded the doc to Storage via a signed URL (folder 'imports'), this
 * endpoint fetches it server-to-server and returns the extracted fields.
 */
const PARSERS = {
	experience: parseExperienceDoc,
	'experience-bulk': parseExperienceBulkDoc,
	testimonials: parseTestimonialDoc,
	stats: parseStatDoc,
	profile: parseProfileDoc,
	skills: parseSkillsBulkDoc
} as const;

type Resource = keyof typeof PARSERS;

export const POST: RequestHandler = async ({ request, locals: { safeGetSession } }) => {
	const { user } = await safeGetSession();
	if (!user) error(401, 'Unauthorized');

	const { url, filename, resource } = await request.json();
	if (!url || typeof url !== 'string') error(400, 'URL dokumen tidak valid.');
	if (!resource || !(resource in PARSERS)) error(400, 'Resource tidak dikenali.');

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
		({ html, plainText } = await extractDocText(buffer, ext));
	} catch (e) {
		error(400, `Gagal membaca dokumen: ${e instanceof Error ? e.message : 'unknown error'}`);
	}

	const result = PARSERS[resource as Resource]({ html, plainText });
	return json(result);
};
