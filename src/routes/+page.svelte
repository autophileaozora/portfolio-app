<script>
	import { onMount } from 'svelte';
	import '$lib/styles/home.css';

	// --- Dummy content for Phase B (visual/behavioral parity, no backend yet) ---
	const heroCards = [
		{ class: 'card-marble', tags: ['#tag1', '#tag1', '#tag1'], headline: 'WEBSITE SMK KRISTEN 5 KLATEN USING REACT JS AND MONGODB', inner: 'marble' },
		{ class: 'card-mesh-1', tags: ['#tag1', '#tag1', '#tag1'], headline: 'WEBSITE SMK KRISTEN 5 KLATEN USING REACT JS AND MONGODB', inner: 'mesh' },
		{ class: 'card-project-dark', tags: ['#tag1', '#tag1', '#tag1'], headline: 'WEBSITE SMK KRISTEN 5 KLATEN USING REACT JS AND MONGODB', inner: null },
		{ class: 'card-mesh-2', tags: ['#MikroTik', '#Network', '#UKSW'], headline: 'SIAMIK LABORATORY NETWORK INFRASTRUCTURE SETUP AND SYSTEM ADMINISTRATION', inner: 'mesh' },
		{ class: 'card-project-dark-2', tags: ['#AVSystem', '#LiveStream'], headline: 'MULTICAM AV LIVE STREAMING & HARDWARE CONTROL CENTER FOR EVENTS', inner: null },
		{ class: 'card-mesh-3', tags: ['#tag1', '#tag1', '#tag1'], headline: 'WEBSITE SMK KRISTEN 5 KLATEN USING REACT JS AND MONGODB', inner: 'mesh' }
	];

	const summaryCards = [
		{ role: 'as An IT Support', date: 'Jan 2020 - Mar 2020', alt: 'IT Support Snapshot', hue: '' },
		{ role: 'as Network Infrastructure Specialist', date: 'Apr 2020 - Aug 2020', alt: 'Network Snapshot', hue: 'style-hue-1' },
		{ role: 'as System Administrator', date: 'Sep 2020 - Dec 2020', alt: 'Sys Admin Snapshot', hue: 'style-hue-2' },
		{ role: 'as AV Live Stream Specialist', date: 'Jan 2021 - Present', alt: 'AV Tech Snapshot', hue: 'style-hue-3' }
	];

	const stats = [
		{ target: 3, label: 'Years in IT Fields' },
		{ target: 12, label: 'Impactful Projects' },
		{ target: 10, label: 'People Has Collaborate' },
		{ target: 24, label: 'Technologies' }
	];

	const experience = [
		{ side: 'exp-above', role: 'IT Support', type: '(Intern)', company: 'at PT Selaras Citra Terabit', date: 'Jan 2020 - Mar 2020' },
		{ side: 'exp-below', role: 'IT Support', type: '(Freelance)', company: 'at Boemisora', date: 'Jan 2020 - Mar 2020' },
		{ side: 'exp-above', role: 'IT Support', type: '(Part Timer)', company: 'at Faculty Information Technology of UKSW', date: 'Jan 2020 - Mar 2020' },
		{ side: 'exp-below', role: 'AV Technician', type: '(Project Based)', company: 'at Boemisora Productions', date: 'Apr 2021 - Present' }
	];

	const skills = ['#IT Support', '#Python', '#JavaScript', '#TypeScript', '#Java', '#CSharp', '#Ruby', '#GoLang', '#Swift', '#Kotlin', '#Rust', '#PHP'];

	const projects = [
		{ img: '/assets/project_mesh.jpg', hue: '', alt: 'Website SMK Kristen 5 Klaten', tags: ['#ReactJS', '#MongoDB', '#NodeJS'], title: 'WEBSITE SMK KRISTEN 5 KLATEN USING REACT JS AND MONGODB' },
		{ img: '/assets/project_mesh.jpg', hue: 'style-hue-1', alt: 'Network Infrastructure SIAMIK', tags: ['#MikroTik', '#Network', '#UKSW'], title: 'SIAMIK LABORATORY NETWORK INFRASTRUCTURE SETUP AND SYSTEM ADMINISTRATION' },
		{ img: '/assets/project_mesh.jpg', hue: 'style-hue-2', alt: 'AV Live Streaming', tags: ['#AVSystem', '#LiveStream'], title: 'MULTICAM AV LIVE STREAMING & HARDWARE CONTROL CENTER FOR EVENTS' },
		{ img: '/assets/project_mesh.jpg', hue: 'style-hue-3', alt: 'IT Support Dashboard', tags: ['#ITSupport', '#Python'], title: 'IT SUPPORT TICKETING & ASSET MANAGEMENT SYSTEM FOR PT SELARAS CITRA TERABIT' },
		{ img: '/assets/project_mesh.jpg', hue: '', alt: 'School Admin Portal', tags: ['#Laravel', '#MySQL', '#PHP'], title: 'SCHOOL ADMINISTRATION PORTAL WITH ATTENDANCE & GRADE MANAGEMENT' }
	];

	// --- element refs ---
	let heroTrackEl;
	let summaryTrackEl;
	let projectsTrackEl;
	let statsGridEl;
	let expScrollInnerEl;
	let expHLineEl;
	let expLineFillEl;
	let expDotEls = [];

	let summaryActiveRole = $state(summaryCards[0].role);
	let summaryActiveDate = $state(summaryCards[0].date);
	let statValues = $state(stats.map(() => 0));

	// 1. Hero carousel: scroll-driven horizontal parallax
	function initHeroCarouselScroll() {
		function handleScroll() {
			const moveX = window.scrollY * 0.75;
			if (heroTrackEl) heroTrackEl.style.transform = `translateX(-${moveX}px)`;
		}
		window.addEventListener('scroll', handleScroll, { passive: true });
		handleScroll();
		return () => window.removeEventListener('scroll', handleScroll);
	}

	// 2. Scramble/decoder text reveal, reused by the summary carousel
	function scrambleText(setText, targetText, duration = 750) {
		const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#$@%&*!?<>';
		const fps = 30;
		const totalFrames = Math.floor((duration / 1000) * fps);
		let frame = 0;

		const timer = setInterval(() => {
			frame++;
			const progress = frame / totalFrames;
			const revealedLength = Math.floor(progress * targetText.length);

			let output = '';
			for (let i = 0; i < targetText.length; i++) {
				if (i < revealedLength) output += targetText[i];
				else if (targetText[i] === ' ') output += ' ';
				else output += chars[Math.floor(Math.random() * chars.length)];
			}
			setText(output);

			if (frame >= totalFrames) {
				setText(targetText);
				clearInterval(timer);
			}
		}, 1000 / fps);
	}

	// 3. Summary auto carousel (seamless infinite loop + scramble text sync)
	function initSummaryAutoCarousel() {
		const track = summaryTrackEl;
		if (!track) return () => {};

		let isTransitioning = false;
		const stepWidth = 230 + 20; // card width + gap

		function nextSlide() {
			if (isTransitioning) return;
			isTransitioning = true;

			const secondCard = track.children[1];
			if (secondCard) {
				const newRole = secondCard.getAttribute('data-role') || 'as An IT Support';
				const newDate = secondCard.getAttribute('data-date') || 'Jan 2020 - Mar 2020';
				scrambleText((v) => (summaryActiveRole = v), newRole, 600);
				scrambleText((v) => (summaryActiveDate = v), newDate, 450);
			}

			track.style.transition = 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)';
			track.style.transform = `translateX(-${stepWidth}px)`;

			setTimeout(() => {
				const firstCard = track.firstElementChild;
				if (firstCard) track.appendChild(firstCard);
				track.style.transition = 'none';
				track.style.transform = 'translateX(0)';
				isTransitioning = false;
			}, 600);
		}

		const interval = setInterval(nextSlide, 3500);
		return () => clearInterval(interval);
	}

	// 4. Projects infinite auto carousel (paused on mobile — stacked list there)
	function initProjectsCarousel() {
		const track = projectsTrackEl;
		if (!track) return () => {};

		let isTransitioning = false;
		const stepWidth = 300 + 24;
		const slideDuration = 520;

		function nextSlide() {
			if (isTransitioning) return;
			if (window.innerWidth <= 768) return;
			isTransitioning = true;

			const firstCard = track.firstElementChild;
			if (!firstCard) {
				isTransitioning = false;
				return;
			}

			track.appendChild(firstCard);
			track.style.transition = 'none';
			track.style.transform = 'translateX(0)';

			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					track.style.transition = `transform ${slideDuration}ms cubic-bezier(0.22, 1, 0.36, 1)`;
					track.style.transform = `translateX(-${stepWidth}px)`;
				});
			});

			setTimeout(() => {
				track.style.transition = 'none';
				track.style.transform = 'translateX(0)';
				isTransitioning = false;
			}, slideDuration + 30);
		}

		const interval = setInterval(nextSlide, 3200);
		return () => clearInterval(interval);
	}

	// 5. Animated counter statistics on scroll into view
	function initCounterAnimations() {
		if (!statsGridEl) return () => {};
		let animated = false;
		const timers = [];

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting && !animated) {
						animated = true;
						stats.forEach((stat, i) => {
							let current = 0;
							const duration = 1500;
							const stepTime = Math.abs(Math.floor(duration / stat.target));
							const timer = setInterval(() => {
								current += 1;
								statValues[i] = current;
								if (current >= stat.target) {
									statValues[i] = stat.target;
									clearInterval(timer);
								}
							}, stepTime);
							timers.push(timer);
						});
					}
				});
			},
			{ threshold: 0.5 }
		);
		observer.observe(statsGridEl);

		return () => {
			observer.disconnect();
			timers.forEach(clearInterval);
		};
	}

	// 6. Mobile work-experience timeline scroll-reveal line
	function initExperienceTimelineMobile() {
		const container = expScrollInnerEl;
		const line = expHLineEl;
		const fill = expLineFillEl;
		const dots = expDotEls.filter(Boolean);
		if (!container || !line || !fill || dots.length < 2) return () => {};

		const MOBILE_BREAKPOINT = 768;
		let ticking = false;

		function measure() {
			if (window.innerWidth > MOBILE_BREAKPOINT) {
				line.style.top = '';
				line.style.height = '';
				return;
			}
			const containerTop = container.getBoundingClientRect().top;
			const firstRect = dots[0].getBoundingClientRect();
			const lastRect = dots[dots.length - 1].getBoundingClientRect();
			const firstDotCenter = firstRect.top + firstRect.height / 2 - containerTop;
			const lastDotCenter = lastRect.top + lastRect.height / 2 - containerTop;
			line.style.top = firstDotCenter + 'px';
			line.style.height = lastDotCenter - firstDotCenter + 'px';
		}

		function updateProgress() {
			if (window.innerWidth > MOBILE_BREAKPOINT) {
				fill.style.height = '0%';
				return;
			}
			const triggerY = window.innerHeight * 0.75;
			const rect = line.getBoundingClientRect();
			let progress = (triggerY - rect.top) / rect.height;
			progress = Math.max(0, Math.min(1, progress));
			fill.style.height = progress * 100 + '%';
		}

		function onScroll() {
			if (ticking) return;
			ticking = true;
			requestAnimationFrame(() => {
				updateProgress();
				ticking = false;
			});
		}

		function onResize() {
			measure();
			updateProgress();
		}

		measure();
		updateProgress();
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onResize);

		return () => {
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onResize);
		};
	}

	onMount(() => {
		const cleanups = [
			initHeroCarouselScroll(),
			initSummaryAutoCarousel(),
			initProjectsCarousel(),
			initCounterAnimations(),
			initExperienceTimelineMobile()
		];
		return () => cleanups.forEach((fn) => fn && fn());
	});
</script>

<svelte:head>
	<title>Andrian Imanuel Sinaga | Tech Enthusiast & IT Support</title>
	<meta name="description" content="Portofolio Andrian Imanuel Sinaga - Tech Enthusiast & Profesional IT Support" />
	<link
		href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="app-container">
	<main>
		<!-- Hero / Profile Section -->
		<section id="home" class="section hero-section">
			<div class="profile-row">
				<div class="profile-left">
					<div class="avatar-container">
						<img src="/assets/avatar.jpg" alt="Andrian Imanuel Sinaga" class="avatar-img" />
					</div>
					<div class="profile-text-details">
						<h1 class="profile-name">ANDRIAN IMANUEL SINAGA</h1>
						<p class="profile-title">Tech Enthusiast</p>
						<p class="profile-location"><i class="fa-solid fa-location-dot"></i> Tangerang, Indonesia</p>
					</div>
				</div>

				<div class="profile-right">
					<div class="social-icons-row">
						<a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn" class="github-circle-btn"
							><i class="fa-brands fa-linkedin-in"></i></a
						>
						<a href="mailto:helloimanuel@yahoo.com" aria-label="Email" class="github-circle-btn"
							><i class="fa-solid fa-envelope"></i></a
						>
						<a href="https://github.com" target="_blank" rel="noreferrer" aria-label="GitHub" class="github-circle-btn"
							><i class="fa-brands fa-github"></i></a
						>
						<a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" class="github-circle-btn"
							><i class="fa-brands fa-instagram"></i></a
						>
					</div>
					<div class="document-links-row">
						<a href="#contact" class="doc-link">Curriculum Vitae</a>
						<a href="#contact" class="doc-link">Resume</a>
					</div>
				</div>
			</div>

			<div class="hero-carousel-wrapper">
				<div class="hero-carousel-track" bind:this={heroTrackEl}>
					{#each heroCards as card}
						<div class="hero-card {card.class}">
							{#if card.inner === 'marble'}
								<div class="marble-canvas-sim"></div>
							{:else if card.inner === 'mesh'}
								<div class="mesh-inner"></div>
							{/if}
							<div class="card-hover-overlay">
								<div class="project-tags">
									{#each card.tags as tag}
										<span class="tag-pill">{tag}</span>
									{/each}
								</div>
								<h3 class="project-headline">{card.headline}</h3>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</section>

		<!-- Summary Section -->
		<section id="summary" class="section summary-section">
			<div class="summary-50-grid">
				<div class="summary-left-col">
					<h2 class="summary-title">SUMMMARY</h2>
					<p class="summary-paragraph">
						Profesional IT Support yang berpengalaman dalam administrasi sistem, troubleshooting perangkat
						keras/lunak, dan instalasi jaringan. Berpengalaman mengelola lab komputer besar, konfigurasi MikroTik,
						dan menangani perangkat AV untuk live streaming. Memiliki kemampuan komunikasi yang baik untuk
						memimpin tim teknis dan memecahkan masalah.
					</p>
				</div>

				<div class="summary-right-col">
					<div class="summary-header-info">
						<span class="summary-role-text">{summaryActiveRole}</span>
						<span class="summary-date-text">{summaryActiveDate}</span>
					</div>

					<div class="summary-carousel-viewport">
						<div class="summary-carousel-track" bind:this={summaryTrackEl}>
							{#each summaryCards as card}
								<div class="summary-card-item" data-role={card.role} data-date={card.date}>
									<img src="/assets/project_mesh.jpg" alt={card.alt} class="summary-card-img {card.hue}" />
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>

			<div class="stats-grid" bind:this={statsGridEl}>
				{#each stats as stat, i}
					<div class="stat-card">
						<div class="stat-number">{statValues[i]}</div>
						<div class="stat-label">{stat.label}</div>
					</div>
				{/each}
			</div>
		</section>

		<!-- Work Experience Section -->
		<section id="experience" class="experience-section-wrap">
			<div class="exp-inner-content">
				<h2 class="section-hashtag">#WORK EXPERIENCE</h2>
			</div>

			<div class="exp-scroll-outer">
				<div class="exp-scroll-inner" bind:this={expScrollInnerEl}>
					<div class="exp-h-line" bind:this={expHLineEl}>
						<div class="exp-h-line-fill" bind:this={expLineFillEl}></div>
					</div>

					<div class="exp-items-track">
						{#each experience as item, i}
							<div class="exp-item {item.side}">
								<div class="exp-dot" bind:this={expDotEls[i]}></div>
								<div class="exp-text-block">
									<h3 class="role-title">{item.role} <span class="role-type">{item.type}</span></h3>
									<div class="company-name">{item.company}</div>
									<div class="timeline-date">{item.date}</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>

			<div class="exp-inner-content">
				<h2 class="section-title" style="margin-bottom: 20px;">RELATED SKILLS</h2>
				<div class="skills-cloud">
					{#each skills as skill}
						<span class="skill-chip">{skill}</span>
					{/each}
				</div>
			</div>
		</section>

		<!-- Projects Carousel Section -->
		<section id="projects" class="projects-carousel-section">
			<div class="projects-carousel-header">
				<h2 class="section-title">PROJECTS</h2>
			</div>

			<div class="projects-carousel-viewport">
				<div class="projects-carousel-track" bind:this={projectsTrackEl}>
					{#each projects as project}
						<div class="proj-card">
							<div class="proj-img-wrapper">
								<img src={project.img} alt={project.alt} class="proj-img {project.hue}" />
							</div>
							<div class="proj-info">
								<div class="proj-tags">
									{#each project.tags as tag}
										<span class="proj-tag">{tag}</span>
									{/each}
								</div>
								<h3 class="proj-title">{project.title}</h3>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<div class="projects-carousel-footer">
				<a href="/projects" class="btn btn-pill-accent" data-sveltekit-reload>See More Project &rarr;</a>
			</div>
		</section>
	</main>
</div>
