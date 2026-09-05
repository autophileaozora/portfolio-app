<script>
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import ConfirmDeleteButton from './ConfirmDeleteButton.svelte';

	/**
	 * columns: [{ key, label }] — rendered in order after the position
	 * select, before the actions column.
	 * rows: records, each must have `id` and `display_order` (a dense
	 * 1..N sequence — the position select relies on that).
	 *
	 * Reordering picks a target position from a <select>; the ?/reorder
	 * action shifts every row in between via the reorder_ranked_item RPC,
	 * so nothing else needs to be renumbered by hand.
	 */
	let { columns, rows, basePath } = $props();
</script>

{#if $page.form?.error}
	<p class="form-error-banner">{$page.form.error}</p>
{/if}

<div class="admin-table-wrap">
	<div class="admin-table-scroll">
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
								<select
									name="display_order"
									value={row.display_order}
									onchange={(e) => e.currentTarget.form?.requestSubmit()}
								>
									{#each rows as _, i (i)}
										<option value={i + 1}>{i + 1}</option>
									{/each}
								</select>
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
</div>
