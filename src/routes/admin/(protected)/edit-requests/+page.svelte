<script>
	let { data } = $props();

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
					<th class="col-order">No</th>
					<th>Project</th>
					<th>Status</th>
					<th class="col-actions">Aksi</th>
				</tr>
			</thead>
			<tbody>
				{#each data.requests as r, i (r.id)}
					<tr>
						<td class="col-order">{i + 1}</td>
						<td>{r.projects?.title ?? '—'}</td>
						<td>{statusLabel(r.status)}</td>
						<td class="col-actions">
							<a href="/admin/edit-requests/{r.id}">{r.status === 'pending' ? 'Review' : 'Lihat'}</a>
						</td>
					</tr>
				{:else}
					<tr>
						<td class="empty" colspan="4">Belum ada permintaan edit.</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
