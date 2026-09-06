<script>
	import AdminForm from '$lib/components/admin/AdminForm.svelte';
	import { ROLE_TYPE_OPTIONS } from '$lib/validation/schemas';

	let { data, form } = $props();

	const fields = [
		{ name: 'role_title', label: 'Jabatan', type: 'text', required: true },
		{ name: 'company_name', label: 'Perusahaan', type: 'text' },
		{ name: 'role_type', label: 'Tipe', type: 'select', options: ROLE_TYPE_OPTIONS },
		{ name: 'date_start', label: 'Tanggal mulai', type: 'date' },
		{ name: 'date_end', label: 'Tanggal selesai', type: 'date' },
		{ name: 'image_url', label: 'Gambar', type: 'file', accept: 'image/*', isImage: true, folder: 'experience' }
	];

	let values = $derived(form?.values ?? data.item);
	let errors = $derived(
		Object.fromEntries(Object.entries(form?.fieldErrors ?? {}).map(([k, v]) => [k, v?.[0]]))
	);
</script>

<svelte:head>
	<title>Admin · Edit Experience</title>
</svelte:head>

<div class="admin-page-header">
	<h1>Edit Experience</h1>
</div>

<AdminForm {fields} {values} {errors} formError={form?.error} cancelHref="/admin/experience" submitLabel="Simpan" />
