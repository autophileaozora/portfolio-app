<script>
	import { onMount, onDestroy } from 'svelte';
	import '$lib/styles/project-detail.css';

	// --- Dummy content for Phase B — same project regardless of slug for now;
	// becomes a real Supabase lookup by slug in a later phase. ---
	const project = {
		title: 'WEBSITE SMK KRISTEN 5 KLATEN USING REACT JS AND MONGODB',
		contributors: 'Imanuel, Louis, Jonathan, Emma',
		associatedWith: 'Universitas Kristen Satya Wacana',
		category: 'Web App',
		dates: 'Aug 2023 - Dec 2023',
		role: 'Product Designer',
		description:
			'Profesional IT Support yang berpengalaman dalam administrasi sistem, troubleshooting perangkat keras/lunak, dan instalasi jaringan. Berpengalaman mengelola lab komputer besar, konfigurasi MikroTik, dan menangani perangkat AV untuk live streaming. Memiliki kemampuan komunikasi yang baik untuk memimpin tim teknis dan memecahkan masalah.',
		tags: ['#Pyhton', '#JavaScript', '#TypeScript', '#Java', '#CSharp', '#Ruby', '#GoLang', '#Swift', '#Kotlin', '#Rust', '#PHP']
	};

	const sections = [
		{ heading: 'Problems', body: project.description },
		{ heading: 'Solutions', body: project.description },
		{ heading: 'Final Results', body: project.description }
	];

	const docSlides = [
		{
			title: 'JUDUL DOKUMENTASI',
			body: 'Teks ini sangat panjang untuk mendemonstrasikan fungsi truncate maksimal 4 baris. Profesional IT Support yang berpengalaman dalam administrasi sistem, troubleshooting perangkat keras/lunak, dan instalasi jaringan. Berpengalaman mengelola lab komputer besar, konfigurasi MikroTik, dan menangani perangkat AV untuk live streaming. Memiliki kemampuan komunikasi yang baik untuk memimpin tim teknis dan memecahkan masalah. Jika melebihi 4 baris, teks ini otomatis terpotong.'
		},
		{
			title: 'KONTEN SLIDE DUA',
			body: 'Perhatikan animasi kartu ini saat berganti. Kartu yang baru akan meluncur lembut dari bawah (ease-in smooth) sambil memudar, sedangkan kartu yang lama hanya memudar (fade) menghilang secara elegan tanpa bergeser.'
		},
		{
			title: 'KONTEN SLIDE TIGA',
			body: 'Ini adalah slide ketiga. Anda bisa mengeklik titik-titik di atas untuk melompat langsung ke slide tertentu. Teks paragraf pada box ini sudah dikunci agar hanya menampilkan empat baris teks dan menambahkan tiga titik elipsis di ujungnya secara otomatis menggunakan CSS native.'
		},
		{
			title: 'KONTEN SLIDE EMPAT',
			body: 'Meskipun ini adalah slide ke-4, jumlah titik di pojok kiri atas tetap dibatasi maksimal 3 sesuai dengan permintaan desain. Indikator aktif akan kembali menyalakan titik pertama, sehingga secara visual layout tetap konsisten. Teks panjang ini juga terpotong tepat 4 baris.'
		}
	];

	const otherProjects = Array.from({ length: 3 }, () => ({
		title: 'WEBSITE SMK KRISTEN 5 KLATEN USING REACT JS AND MONGODB',
		role: 'UI/UX Designer',
		duration: '2 Weeks',
		category: 'App'
	}));

	// --- Documentation carousel (ported from projects/detail/script.js) ---
	let currentSlide = $state(0);
	let autoPlayInterval;

	function goToSlide(index) {
		currentSlide = index;
	}

	function activeDotIndex() {
		return currentSlide % 3;
	}

	function startAutoPlay() {
		autoPlayInterval = setInterval(() => {
			currentSlide = (currentSlide + 1) % docSlides.length;
		}, 5000);
	}

	function resetAutoPlay() {
		clearInterval(autoPlayInterval);
		startAutoPlay();
	}

	function onDotClick(idx) {
		goToSlide(idx);
		resetAutoPlay();
	}

	onMount(() => {
		startAutoPlay();
	});
	onDestroy(() => clearInterval(autoPlayInterval));
</script>

<svelte:head>
	<title>Portfolio - {project.title}</title>
</svelte:head>

<div class="container">
	<header class="hero" id="home">
		<div class="meta-row">
			<div class="meta-item">
				<div class="label">Contributor :</div>
				<div class="value">{project.contributors}</div>
			</div>
			<div class="meta-item">
				<div class="label">Associated with :</div>
				<div class="value">{project.associatedWith}</div>
			</div>
			<div class="meta-item">
				<div class="label">Categories :</div>
				<div class="value">{project.category}</div>
			</div>
			<div class="meta-item">
				<div class="label">Dates :</div>
				<div class="value">{project.dates}</div>
			</div>
			<div class="meta-item">
				<div class="label">Roles :</div>
				<div class="value">{project.role}</div>
			</div>
		</div>

		<div class="hero-content">
			<div class="hero-left">
				<h1>{project.title}</h1>
				<p>{project.description}</p>
			</div>
			<div class="hero-right">
				<div class="tags">
					{#each project.tags as tag}
						<span class="tag">{tag}</span>
					{/each}
				</div>
			</div>
		</div>
	</header>

	<!-- svelte-ignore a11y_invalid_attribute -- live project URL not modeled yet (Phase B) -->
	<a href="#" class="cta-button">SEE LIVE PROJECT &rarr;</a>

	<section class="cards-grid">
		{#each sections as section}
			<div class="card">
				<div class="card-bg"></div>
				<div class="card-content">
					<h2>{section.heading}</h2>
					<p>{section.body}</p>
				</div>
				<div class="cards-slashes">
					<div class="just-slashes"></div>
					<div class="just-slashes"></div>
					<div class="just-slashes"></div>
				</div>
			</div>
		{/each}
	</section>
</div>

<!-- Documentation Carousel -->
<section class="carousel-section" id="project">
	<div class="carousel-dots">
		{#each docSlides.slice(0, 3) as _, idx}
			<div class="dot" class:active={idx === activeDotIndex()} onclick={() => onDotClick(idx)}></div>
		{/each}
	</div>

	<div class="carousel-track">
		{#each docSlides as slide, idx}
			<div class="carousel-slide" class:active={idx === currentSlide}>
				<div class="glass-card-wrapper">
					<div class="glass-card"></div>
					<div class="glass-content">
						<h4>{slide.title}</h4>
						<p>{slide.body}</p>
					</div>
					<div class="dokumentasi-slashes">
						<div class="dokumentasi-slash"></div>
						<div class="dokumentasi-slash"></div>
						<div class="dokumentasi-slash"></div>
					</div>
				</div>
			</div>
		{/each}
	</div>
</section>

<!-- Other Projects -->
<section class="other-projects-section" id="others">
	<div class="other-projects-container">
		<h2 class="op-title">OTHER PROJECTS</h2>

		<div class="op-grid">
			{#each otherProjects as card}
				<div class="card-wrapper">
					<div class="card-header">
						<a href="/projects" class="card-arrow-btn" aria-label="Lihat Project" data-sveltekit-reload>
							<img src="/assets/arrow_button.png" alt="Arrow" class="arrow-icon" />
						</a>
						<div class="thumbnail-wrapper">
							<img src="/assets/card_header_bg.png" alt="Project Preview" class="card-thumbnail" />
						</div>
					</div>
					<article class="project-card">
						<h3 class="card-title">{card.title}</h3>
						<div class="card-meta">
							<div class="meta-row">
								<span class="meta-label">Role :</span>
								<span class="meta-value">{card.role}</span>
							</div>
							<div class="divider"></div>
							<div class="meta-row">
								<span class="meta-label">Duration :</span>
								<span class="meta-value">{card.duration}</span>
							</div>
							<div class="divider"></div>
							<div class="meta-row">
								<span class="meta-label">Categories :</span>
								<span class="meta-value">{card.category}</span>
							</div>
						</div>
					</article>
					<div class="wrap-slashes">
						<div class="card-slashes"></div>
						<div class="card-slashes"></div>
						<div class="card-slashes"></div>
					</div>
				</div>
			{/each}
		</div>

		<div class="op-footer">
			<a href="/projects" class="op-see-more" data-sveltekit-reload>See More Project &rarr;</a>
		</div>
	</div>
</section>
