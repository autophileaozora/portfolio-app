/**
 * Indonesian UI strings — covers every static (hardcoded) label, button,
 * heading and microcopy across the public site. Content the admin writes
 * themselves (project descriptions, bio, experience, testimonials — stored
 * in Supabase) is NOT covered here; it stays in whatever language it was
 * written in regardless of the selected UI locale. See src/lib/i18n/index.js.
 */
export default {
	nav: {
		home: 'BERANDA',
		projects: 'PROYEK',
		articles: 'ARTIKEL',
		messages: 'PESAN',
		contact: 'KONTAK',
		language: 'BAHASA',
		unavailableMessage: 'Maaf, fitur sedang dikembangkan.',
		ok: 'Oke, Mengerti'
	},

	common: {
		role: 'Peran :',
		duration: 'Durasi :',
		categories: 'Kategori :',
		seeMoreProject: 'Lihat Project Lainnya',
		viewProjectAria: 'Lihat Project',
		viewProjectWithTitleAria: (title) => `Lihat project: ${title}`
	},

	home: {
		curriculumVitae: 'Curriculum Vitae',
		resume: 'Resume',
		summaryTitle: 'RINGKASAN',
		workExperienceHashtag: '#PENGALAMAN KERJA',
		relatedSkillsTitle: 'KEAHLIAN TERKAIT',
		projectsTitle: 'PROYEK'
	},

	projectsListing: {
		searchLabel: 'Cari',
		filterLabel: 'Filter',
		searchPlaceholder: 'Cari project...',
		filterProjectsTitle: 'Filter Project',
		resetAll: 'Atur Ulang',
		sortBy: 'Urutkan',
		category: 'Kategori',
		sortLabels: { newest: 'Terbaru', oldest: 'Terlama', asc: 'A → Z', desc: 'Z → A' },
		categoryLabels: { all: 'Semua', web: 'Web', app: 'App', design: 'Design' },
		noProjectsFound: 'Tidak ada project yang cocok dengan pencarian/filter ini.',
		prev: 'Sebelumnya',
		next: 'Berikutnya',
		prevAria: 'Halaman sebelumnya',
		nextAria: 'Halaman berikutnya'
	},

	projectDetail: {
		contributor: 'Kontributor :',
		associatedWith: 'Terafiliasi dengan :',
		categories: 'Kategori :',
		dates: 'Tanggal :',
		duration: 'Durasi :',
		roles: 'Peran :',
		requestEditLink: 'Ajukan Edit',
		seeLiveProject: 'LIHAT PROJECT LIVE',
		otherProjectsTitle: 'PROJECT LAINNYA',
		slideAria: (n) => `Lihat slide dokumentasi ${n}`
	},

	requestEdit: {
		pageTitle: (title) => `Ajukan Edit — ${title}`,
		thankYouTitle: 'Terima kasih!',
		thankYouBefore: 'Permintaan edit kamu untuk',
		thankYouAfter: 'sudah terkirim dan menunggu review admin. Perubahan baru akan tayang setelah disetujui.',
		backToProject: '← Kembali ke project',
		requestEditTitle: (title) => `Ajukan Edit: ${title}`,
		step1Intro: 'Sebelum lanjut, kami perlu tahu siapa yang mengusulkan perubahan ini.',
		nameLabel: 'Nama',
		instagramLabel: 'Username Instagram',
		instagramPlaceholder: 'tanpa @',
		whatsappLabel: 'Nomor WhatsApp (opsional)',
		continueToEdit: 'Lanjut ke Edit',
		cancel: 'Batal',
		editTitle: (title) => `Edit: ${title}`,
		step2Intro:
			'Perubahan kamu akan direview dulu oleh admin sebelum tayang di halaman publik. Daftar "Slide Dokumentasi" di bawah sudah diisi slide yang ada sekarang — edit, hapus, atau tambah baris sesuai kebutuhan; daftar akhir yang kamu kirim akan menggantikan slide yang ada.',
		submitLabel: 'Kirim Permintaan Edit'
	},

	footer: {
		testimonialLabel: 'TESTIMONI',
		noTestimonial: 'Belum ada testimonial.',
		leaveMessageTitle: 'TINGGALKAN PESAN',
		leaveMessageDesc:
			'Hai, aku sangat menghargai kalau kamu mau memberi ulasan atau pesan apa pun. Tenang saja, pesan anonim juga bisa kok dengan mencentang elemen anonim.',
		sendMessages: 'Kirim Pesan',
		readMessages: 'Baca Pesan',
		copyBtn: 'SALIN',
		emailCopiedToast: (email) => `Email disalin ke clipboard: ${email}`,
		emailFallbackToast: (email) => `Email: ${email}`
	},

	messageModal: {
		title: 'Tinggalkan Ulasan atau Pesan',
		photoLabel: 'Foto',
		optionalBadge: 'opsional',
		uploading: 'Mengunggah...',
		changePhoto: 'Ganti foto',
		clickToUploadPhoto: 'Klik untuk unggah foto',
		yourName: 'Nama Kamu',
		namePlaceholder: 'contoh: Abraham',
		instagramOptional: 'Instagram (opsional)',
		instagramPlaceholder: '@username',
		sendAsAnonymous: 'Kirim sebagai Elemen Anonim',
		projectTogether: 'Project yang pernah kita kerjakan bersama (opsional)',
		noneSkipOption: '— Tidak ada / lewati —',
		newProjectOption: '+ Project yang belum ada di daftar',
		projectNamePlaceholder: 'Nama project',
		newProjectHint: 'Menambahkan project baru tidak bisa anonim — nama kamu wajib diisi.',
		yourMessage: 'Pesan / Masukan Kamu',
		messagePlaceholder: 'Tulis pesanmu di sini...',
		sending: 'Mengirim...',
		submit: 'Kirim Pesan',
		sentToast: 'Pesan berhasil terkirim! Terima kasih.',
		failedGeneric: 'Gagal mengirim pesan.',
		errorGeneric: 'Terjadi kesalahan. Coba lagi.',
		uploadFailed: 'Upload gagal.'
	},

	readModal: {
		title: 'Pesan & Masukan yang Sudah Dibalas',
		noAnswered: 'Belum ada pesan yang dibalas.',
		anonymousLabel: 'Elemen Anonim'
	}
};
