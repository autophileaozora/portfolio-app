<script>
	import AdminForm from '$lib/components/admin/AdminForm.svelte';

	let { form } = $props();

	const fields = [
		{ name: 'role_title', label: 'Jabatan', type: 'text', required: true },
		{ name: 'company_name', label: 'Perusahaan', type: 'text' },
		{ name: 'role_type', label: 'Tipe (mis. Full-time, Magang)', type: 'text' },
		{ name: 'date_start', label: 'Tanggal mulai', type: 'date' },
		{ name: 'date_end', label: 'Tanggal selesai', type: 'date' },
		{ name: 'display_order', label: 'Urutan', type: 'number', default: 0 }
	];

	let errors = $derived(
		Object.fromEntries(Object.entries(form?.fieldErrors ?? {}).map(([k, v]) => [k, v?.[0]]))
	);
</script>

<svelte:head>
	<title>Admin · Tambah Experience</title>
</svelte:head>

<div class="admin-page-header">
	<h1>Tambah Experience</h1>
</div>

<AdminForm {fields} values={form?.values} {errors} formError={form?.error} cancelHref="/admin/experience" submitLabel="Tambah" />
