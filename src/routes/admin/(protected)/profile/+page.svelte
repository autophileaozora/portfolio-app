<script>
	import AdminForm from '$lib/components/admin/AdminForm.svelte';

	let { data, form } = $props();

	const fields = [
		{ name: 'full_name', label: 'Nama lengkap', type: 'text', required: true },
		{ name: 'title', label: 'Jabatan / tagline', type: 'text' },
		{ name: 'location', label: 'Lokasi', type: 'text' },
		{ name: 'avatar_url', label: 'URL foto profil', type: 'text' },
		{ name: 'email', label: 'Email', type: 'text' },
		{ name: 'social_linkedin', label: 'LinkedIn URL', type: 'text' },
		{ name: 'social_github', label: 'GitHub URL', type: 'text' },
		{ name: 'social_instagram', label: 'Instagram URL', type: 'text' },
		{ name: 'social_whatsapp', label: 'WhatsApp URL', type: 'text' },
		{ name: 'cv_url', label: 'URL CV', type: 'text' },
		{ name: 'resume_url', label: 'URL Resume', type: 'text' },
		{ name: 'summary_paragraph', label: 'Ringkasan / bio', type: 'textarea' }
	];

	let values = $derived(form?.values ?? data.profile);
	let errors = $derived(
		Object.fromEntries(Object.entries(form?.fieldErrors ?? {}).map(([k, v]) => [k, v?.[0]]))
	);
</script>

<svelte:head>
	<title>Admin · Profile</title>
</svelte:head>

<div class="admin-page-header">
	<h1>Profile</h1>
</div>

<AdminForm
	{fields}
	{values}
	{errors}
	formError={form?.error}
	successMessage={form?.success ? 'Tersimpan.' : ''}
	cancelHref="/admin"
	submitLabel="Simpan"
/>
