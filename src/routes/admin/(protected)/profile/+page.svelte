<script>
	import AdminForm from '$lib/components/admin/AdminForm.svelte';
	import DocImportBox from '$lib/components/admin/DocImportBox.svelte';

	let { data, form } = $props();

	const fields = [
		{ name: 'full_name', label: 'Nama lengkap', type: 'text', required: true },
		{ name: 'title', label: 'Jabatan / tagline', type: 'text' },
		{ name: 'location', label: 'Lokasi', type: 'text' },
		{ name: 'avatar_url', label: 'Foto profil', type: 'file', accept: 'image/*', isImage: true, folder: 'avatars' },
		{ name: 'email', label: 'Email', type: 'text' },
		{ name: 'social_linkedin', label: 'LinkedIn URL', type: 'text' },
		{ name: 'social_github', label: 'GitHub URL', type: 'text' },
		{ name: 'social_instagram', label: 'Instagram URL', type: 'text' },
		{ name: 'social_whatsapp', label: 'WhatsApp URL', type: 'text' },
		{ name: 'cv_url', label: 'File CV', type: 'file', accept: '.pdf,application/pdf', folder: 'documents' },
		{ name: 'resume_url', label: 'File Resume', type: 'file', accept: '.pdf,application/pdf', folder: 'documents' },
		{ name: 'summary_paragraph', label: 'Ringkasan / bio', type: 'textarea' },
		{ name: 'availability_text', label: 'Teks ketersediaan (footer)', type: 'text' },
		{ name: 'connect_text', label: 'Teks "terhubung" (footer)', type: 'text' },
		{ name: 'footer_copyright', label: 'Teks copyright (footer)', type: 'text' }
	];

	const TEMPLATE_HELP_TEXT = `Format yang didukung (heading, lalu isinya di baris berikutnya):

Nama Lengkap          (wajib)
Jabatan
Lokasi
Email
LinkedIn
GitHub
Instagram
WhatsApp
Ringkasan             (boleh beberapa paragraf)
Teks Ketersediaan
Teks Terhubung
Copyright

Untuk .docx: beri baris heading itu style "Heading 1/2/3" bawaan Word.
Untuk PDF: tulis labelnya di awal baris (boleh diikuti nilainya di baris
yang sama, mis. "Jabatan Frontend Developer").
Foto profil, CV, dan Resume tidak ikut terisi otomatis — tetap upload
manual di bawah.`;

	let importedValues = $state({});
	function onImportResult({ fields }) {
		Object.assign(importedValues, fields);
	}

	let values = $derived({ ...(form?.values ?? data.profile), ...importedValues });
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

<DocImportBox resource="profile" templateHelp={TEMPLATE_HELP_TEXT} onResult={onImportResult} />

<AdminForm
	{fields}
	{values}
	{errors}
	formError={form?.error}
	successMessage={form?.success ? 'Tersimpan.' : ''}
	cancelHref="/admin"
	submitLabel="Simpan"
/>
