<script>
	import AdminForm from '$lib/components/admin/AdminForm.svelte';

	let { data, form } = $props();

	const fields = [
		{ name: 'author_name', label: 'Nama', type: 'text', required: true },
		{ name: 'author_role', label: 'Peran (mis. Rekan Kerja)', type: 'text' },
		{ name: 'quote', label: 'Quote', type: 'textarea', required: true },
		{ name: 'is_published', label: 'Terbitkan di halaman publik', type: 'checkbox' }
	];

	let values = $derived(form?.values ?? data.testimonial);
	let errors = $derived(
		Object.fromEntries(Object.entries(form?.fieldErrors ?? {}).map(([k, v]) => [k, v?.[0]]))
	);
</script>

<svelte:head>
	<title>Admin · Edit Testimonial</title>
</svelte:head>

<div class="admin-page-header">
	<h1>Edit Testimonial</h1>
</div>

<AdminForm {fields} {values} {errors} formError={form?.error} cancelHref="/admin/testimonials" submitLabel="Simpan" />
