<script>
	import ConfirmDeleteButton from '$lib/components/admin/ConfirmDeleteButton.svelte';

	let { data } = $props();

	function senderLabel(m) {
		return m.is_anonymous ? 'Anonim' : m.sender_name || '—';
	}
	function formatDate(iso) {
		return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
	}
</script>

<svelte:head>
	<title>Admin · Messages</title>
</svelte:head>

<div class="admin-page-header">
	<h1>Messages</h1>
</div>

<div class="admin-table-wrap">
	<div class="admin-table-scroll">
		<table class="admin-table">
			<thead>
				<tr>
					<th>Pengirim</th>
					<th>Pesan</th>
					<th>Status</th>
					<th>Tanggal</th>
					<th class="col-actions">Aksi</th>
				</tr>
			</thead>
			<tbody>
				{#each data.messages as m (m.id)}
					<tr>
						<td>{senderLabel(m)}</td>
						<td>{m.content}</td>
						<td>{m.status === 'answered' ? 'Sudah dibalas' : 'Pending'}</td>
						<td>{formatDate(m.created_at)}</td>
						<td class="col-actions">
							<a href="/admin/messages/{m.id}">{m.status === 'answered' ? 'Lihat' : 'Balas'}</a>
							<ConfirmDeleteButton id={m.id} />
						</td>
					</tr>
				{:else}
					<tr>
						<td class="empty" colspan="5">Belum ada pesan.</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
