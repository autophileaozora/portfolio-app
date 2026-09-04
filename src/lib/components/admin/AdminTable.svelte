<script>
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import ConfirmDeleteButton from './ConfirmDeleteButton.svelte';

	/**
	 * columns: [{ key, label }] — rendered in order after the drag-free
	 * display_order input, before the actions column.
	 * rows: records, each must have `id` and `display_order`.
	 */
	let { columns, rows, basePath } = $props();
</script>

{#if $page.form?.error}
	<p class="form-error-banner">{$page.form.error}</p>
{/if}

<div class="admin-table-wrap">
	<table class="admin-table">
		<thead>
			<tr>
				<th class="col-order">Urutan</th>
				{#each columns as col (col.key)}
					<th>{col.label}</th>
				{/each}
				<th class="col-actions">Aksi</th>
			</tr>
		</thead>
		<tbody>
			{#each rows as row (row.id)}
				<tr>
					<td class="col-order">
						<form method="POST" action="?/reorder" use:enhance>
							<input type="hidden" name="id" value={row.id} />
							<input
								type="number"
								name="display_order"
								value={row.display_order}
								onchange={(e) => e.currentTarget.form?.requestSubmit()}
							/>
						</form>
					</td>
					{#each columns as col (col.key)}
						<td>{row[col.key]}</td>
					{/each}
					<td class="col-actions">
						<a href="{basePath}/{row.id}">Edit</a>
						<ConfirmDeleteButton id={row.id} />
					</td>
				</tr>
			{:else}
				<tr>
					<td class="empty" colspan={columns.length + 2}>Belum ada data.</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
