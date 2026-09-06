<script>
	import AdminForm from '$lib/components/admin/AdminForm.svelte';

	let { data, form } = $props();

	const fields = [
		{ name: 'site_name', label: 'Nama Website', type: 'text' },
		{
			name: 'favicon_url',
			label: 'Favicon (ikon tab browser)',
			type: 'file',
			accept: 'image/png,image/svg+xml,image/x-icon',
			isImage: true,
			folder: 'branding'
		},
		{
			name: 'og_image_url',
			label: 'Thumbnail saat Dibagikan (Open Graph)',
			type: 'file',
			accept: 'image/*',
			isImage: true,
			folder: 'branding'
		},
		{ name: 'google_site_verification', label: 'Kode Verifikasi Google Search Console', type: 'text' }
	];

	let values = $derived(form?.values ?? data.seoSettings);
	let errors = $derived(
		Object.fromEntries(Object.entries(form?.fieldErrors ?? {}).map(([k, v]) => [k, v?.[0]]))
	);
</script>

<svelte:head>
	<title>Admin · SEO</title>
</svelte:head>

<div class="admin-page-header">
	<h1>Pengaturan SEO</h1>
</div>

<p class="doc-import-sub" style="margin-bottom: 1rem;">
	Nama Website dipakai untuk tag <code>og:site_name</code>. Favicon menggantikan ikon tab browser
	bawaan (saat ini masih logo default SvelteKit kalau belum diisi). Thumbnail di sini dipakai
	sebagai gambar bagikan (Open Graph/Twitter Card) di semua halaman kalau diisi — kalau kosong,
	otomatis pakai foto profil sebagai gantinya. Kode Verifikasi Google Search Console mengisi tag
	<code>&lt;meta name="google-site-verification"&gt;</code> di setiap halaman, jadi verifikasi
	ulang di masa depan tidak perlu upload file HTML lagi — cukup isi kode dari Search Console
	(Settings → Ownership verification → HTML tag, ambil bagian <code>content="..."</code> saja).
</p>

<AdminForm
	{fields}
	{values}
	{errors}
	formError={form?.error}
	successMessage={form?.success ? 'Tersimpan.' : ''}
	cancelHref="/admin"
	submitLabel="Simpan"
/>
