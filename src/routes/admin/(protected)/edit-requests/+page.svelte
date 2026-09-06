<script>
	let { data } = $props();

	function formatDate(iso) {
		return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
	}
	function statusLabel(s) {
		return { pending: 'Menunggu', approved: 'Disetujui', rejected: 'Ditolak' }[s] ?? s;
	}
</script>

<svelte:head>
	<title>Admin · Edit Requests</title>
</svelte:head>

<div class="admin-page-header">
	<h1>Permintaan Edit dari Publik</h1>
</div>

<div class="admin-table-wrap">
	<div class="admin-table-scroll">
		<table class="admin-table">
			<thead>
				<tr>
					<th>Project</th>
					<th>Pengusul</th>
					<th>Instagram</th>
					<th>Status</th>
					<th>Tanggal</th>
					<th class="col-actions">Aksi</th>
				</tr>
			</thead>
			<tbody>
				{#each data.requests as r (r.id)}
					<tr>
						<td>{r.projects?.title ?? '—'}</td>
						<td>{r.requester_name}</td>
						<td>@{r.requester_instagram}</td>
						<td>{statusLabel(r.status)}</td>
						<td>{formatDate(r.created_at)}</td>
						<td class="col-actions">
							<a href="/admin/edit-requests/{r.id}">{r.status === 'pending' ? 'Review' : 'Lihat'}</a>
						</td>
					</tr>
				{:else}
					<tr>
						<td class="empty" colspan="6">Belum ada permintaan edit.</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
