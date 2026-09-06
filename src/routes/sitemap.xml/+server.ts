import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
	const { data: projects } = await supabase
		.from('projects')
		.select('slug, updated_at')
		.eq('is_published', true)
		.order('display_order');

	const staticEntries = [
		{ loc: '/', changefreq: 'weekly', priority: '1.0' },
		{ loc: '/projects', changefreq: 'weekly', priority: '0.9' }
	];

	const projectEntries = (projects ?? []).map((p) => ({
		loc: `/projects/${p.slug}`,
		lastmod: p.updated_at,
		changefreq: 'monthly',
		priority: '0.8'
	}));

	const entries = [...staticEntries, ...projectEntries];

	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
	.map(
		(e) => `  <url>
    <loc>${url.origin}${e.loc}</loc>
${e.lastmod ? `    <lastmod>${new Date(e.lastmod).toISOString()}</lastmod>\n` : ''}    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`
	)
	.join('\n')}
</urlset>
`;

	return new Response(body, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
		}
	});
};
