<script>
	import ConfirmDeleteButton from '$lib/components/admin/ConfirmDeleteButton.svelte';

	let { data } = $props();

	function senderLabel(m) {
		return m.is_anonymous ? 'Anonim' : m.sender_name || '—';
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
					<th class="col-order">No</th>
					<th>Pengirim</th>
					<th>Status</th>
					<th class="col-actions">Aksi</th>
				</tr>
			</thead>
			<tbody>
				{#each data.messages as m, i (m.id)}
					<tr>
						<td class="col-order">{i + 1}</td>
						<td>{senderLabel(m)}</td>
						<td>{m.status === 'answered' ? 'Sudah dibalas' : 'Pending'}</td>
						<td class="col-actions">
							<a href="/admin/messages/{m.id}">{m.status === 'answered' ? 'Lihat' : 'Balas'}</a>
							<ConfirmDeleteButton id={m.id} />
						</td>
					</tr>
				{:else}
					<tr>
						<td class="empty" colspan="4">Belum ada pesan.</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
