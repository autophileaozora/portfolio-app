<script>
	import AdminForm from '$lib/components/admin/AdminForm.svelte';

	let { form } = $props();

	const fields = [
		{ name: 'author_name', label: 'Nama', type: 'text', required: true },
		{ name: 'author_role', label: 'Peran (mis. Rekan Kerja)', type: 'text' },
		{ name: 'quote', label: 'Quote', type: 'textarea', required: true },
		{ name: 'is_published', label: 'Terbitkan di halaman publik', type: 'checkbox', default: true },
		{ name: 'display_order', label: 'Urutan', type: 'number', default: 0 }
	];

	let errors = $derived(
		Object.fromEntries(Object.entries(form?.fieldErrors ?? {}).map(([k, v]) => [k, v?.[0]]))
	);
</script>

<svelte:head>
	<title>Admin · Tambah Testimonial</title>
</svelte:head>

<div class="admin-page-header">
	<h1>Tambah Testimonial</h1>
</div>

<AdminForm {fields} values={form?.values} {errors} formError={form?.error} cancelHref="/admin/testimonials" submitLabel="Tambah" />
