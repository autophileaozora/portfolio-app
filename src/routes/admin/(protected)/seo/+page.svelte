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

	function formatDuration(seconds) {
		if (!seconds) return '0d';
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		return m ? `${m}m ${s}d` : `${s}d`;
	}
	function formatDate(iso) {
		return new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
	}
	const EVENT_LABELS = {
		pageview: 'Kunjungan',
		click: 'Klik',
		scroll: 'Scroll',
		duration: 'Durasi',
		error: 'Error'
	};
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

<div class="section-group">
	<div class="admin-page-header">
		<h2>Analitik Pengunjung (30 hari terakhir)</h2>
	</div>

	{#if !data.analytics.hasData}
		<p class="doc-import-sub">
			Belum ada data pengunjung tercatat. Data mulai terkumpul otomatis begitu ada orang membuka
			halaman publik situs ini (butuh tabel <code>analytics_events</code> — lihat migration
			terkait kalau halaman ini error).
		</p>
	{:else}
		<div class="analytics-summary-grid">
			<div class="analytics-card">
				<div class="analytics-card-value">{data.analytics.totalPageviews}</div>
				<div class="analytics-card-label">Total Kunjungan Halaman</div>
			</div>
			<div class="analytics-card">
				<div class="analytics-card-value">{data.analytics.uniqueSessions}</div>
				<div class="analytics-card-label">Pengunjung Unik (session)</div>
			</div>
			<div class="analytics-card">
				<div class="analytics-card-value">{data.analytics.newSessions} / {data.analytics.returningSessions}</div>
				<div class="analytics-card-label">Baru / Berulang</div>
			</div>
			<div class="analytics-card">
				<div class="analytics-card-value">{formatDuration(data.analytics.avgDurationSeconds)}</div>
				<div class="analytics-card-label">Rata-rata Durasi Kunjungan</div>
			</div>
			<div class="analytics-card" class:analytics-card-warn={data.analytics.errorCount > 0}>
				<div class="analytics-card-value">{data.analytics.errorCount}</div>
				<div class="analytics-card-label">Error Teknis (JS)</div>
			</div>
		</div>

		<div class="analytics-lists-grid">
			<div class="analytics-list">
				<h3>Halaman Terpopuler</h3>
				{#each data.analytics.topPages as row (row.label)}
					<div class="analytics-list-row"><span>{row.label}</span><b>{row.count}</b></div>
				{:else}
					<p class="repeater-empty">Belum ada.</p>
				{/each}
			</div>
			<div class="analytics-list">
				<h3>Sumber Trafik (Referrer)</h3>
				{#each data.analytics.topReferrers as row (row.label)}
					<div class="analytics-list-row"><span>{row.label}</span><b>{row.count}</b></div>
				{:else}
					<p class="repeater-empty">Belum ada.</p>
				{/each}
			</div>
			<div class="analytics-list">
				<h3>Negara Pengunjung</h3>
				{#each data.analytics.topCountries as row (row.label)}
					<div class="analytics-list-row"><span>{row.label}</span><b>{row.count}</b></div>
				{:else}
					<p class="repeater-empty">Belum ada.</p>
				{/each}
			</div>
			<div class="analytics-list">
				<h3>Browser</h3>
				{#each data.analytics.topBrowsers as row (row.label)}
					<div class="analytics-list-row"><span>{row.label}</span><b>{row.count}</b></div>
				{:else}
					<p class="repeater-empty">Belum ada.</p>
				{/each}
			</div>
			<div class="analytics-list">
				<h3>Jenis Perangkat</h3>
				{#each data.analytics.topDevices as row (row.label)}
					<div class="analytics-list-row"><span>{row.label}</span><b>{row.count}</b></div>
				{:else}
					<p class="repeater-empty">Belum ada.</p>
				{/each}
			</div>
		</div>

		<h3 class="analytics-recent-title">Aktivitas Terbaru</h3>
		<div class="admin-table-wrap">
			<div class="admin-table-scroll">
				<table class="admin-table">
					<thead>
						<tr>
							<th>Waktu</th>
							<th>Tipe</th>
							<th>Halaman</th>
							<th>Negara/Kota</th>
							<th>Browser</th>
							<th>OS</th>
							<th>Perangkat</th>
							<th>Resolusi</th>
							<th>Bahasa</th>
							<th>Timezone</th>
							<th>Referrer</th>
							<th>UTM Source</th>
							<th>IP</th>
							<th>Detail</th>
						</tr>
					</thead>
					<tbody>
						{#each data.analytics.recent as ev (ev.id)}
							<tr>
								<td>{formatDate(ev.created_at)}</td>
								<td>{EVENT_LABELS[ev.event_type] ?? ev.event_type}</td>
								<td>{ev.path ?? '—'}</td>
								<td>{[ev.city, ev.country].filter(Boolean).join(', ') || '—'}</td>
								<td>{ev.browser ?? '—'}</td>
								<td>{ev.os ?? '—'}</td>
								<td>{ev.device_type ?? '—'}</td>
								<td>{ev.screen_width && ev.screen_height ? `${ev.screen_width}×${ev.screen_height}` : '—'}</td>
								<td>{ev.language ?? '—'}</td>
								<td>{ev.timezone ?? '—'}</td>
								<td>{ev.referrer ?? 'Langsung'}</td>
								<td>{ev.utm_source ?? '—'}</td>
								<td>{ev.ip_address ?? '—'}</td>
								<td>
									{#if ev.event_type === 'duration'}
										{formatDuration(ev.duration_seconds)}, scroll {ev.scroll_percent ?? 0}%
									{:else if ev.event_type === 'scroll'}
										scroll {ev.scroll_percent}%
									{:else if ev.event_type === 'click' || ev.event_type === 'error'}
										{ev.label ?? '—'}
									{:else}
										—
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>

<style>
	.analytics-summary-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
		gap: 0.75rem;
		margin-bottom: 1.25rem;
	}

	.analytics-card {
		background: #fff;
		border: 1px solid rgba(20, 20, 30, 0.06);
		border-radius: 14px;
		padding: 1rem;
		box-shadow:
			0 1px 2px rgba(20, 20, 30, 0.03),
			0 8px 24px rgba(20, 20, 30, 0.05);
	}

	.analytics-card-warn {
		border-color: rgba(220, 38, 38, 0.3);
	}

	.analytics-card-value {
		font-size: 1.6rem;
		font-weight: 700;
		color: #33333c;
	}

	.analytics-card-warn .analytics-card-value {
		color: #dc2626;
	}

	.analytics-card-label {
		font-size: 0.78rem;
		color: #77777f;
		margin-top: 0.2rem;
	}

	.analytics-lists-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}

	.analytics-list {
		background: #fff;
		border: 1px solid rgba(20, 20, 30, 0.06);
		border-radius: 14px;
		padding: 0.9rem 1rem;
	}

	.analytics-list h3 {
		margin: 0 0 0.5rem;
		font-size: 0.85rem;
		color: #4c3fd6;
	}

	.analytics-list-row {
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
		font-size: 0.82rem;
		padding: 0.25rem 0;
		border-bottom: 1px solid #f2f2f5;
	}

	.analytics-list-row:last-child {
		border-bottom: none;
	}

	.analytics-list-row span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.analytics-recent-title {
		font-size: 1.05rem;
		margin: 0 0 0.75rem;
	}
</style>
