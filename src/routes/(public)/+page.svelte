<script>
	import { onMount } from 'svelte';
	import '$lib/styles/home.css';
	import { jsonLdScriptTag } from '$lib/utils/jsonLd.js';

	let { data } = $props();

	// The personal-brand handle the user goes by (e.g. "helloimanuel") —
	// derived from the email's local part rather than hardcoded, so it
	// stays correct if that ever changes without needing a code edit.
	let brandHandle = $derived(data.profile?.email ? data.profile.email.split('@')[0] : '');

	// SEO title/description are built to explicitly carry the target
	// search terms (web developer, IT support) alongside the real name,
	// brand handle, and location — while still preferring the admin's own
	// written bio (summary_paragraph) as the description whenever it's
	// set, since unique real content is better for search than a
	// templated sentence.
	let seoTitle = $derived(
		data.profile?.full_name
			? `${data.profile.full_name}${brandHandle ? ` (${brandHandle})` : ''} — Web Developer & IT Support${data.profile.location ? ` di ${data.profile.location}` : ''}`
			: 'Portfolio'
	);
	let seoDescription = $derived(
		data.profile?.summary_paragraph ||
			(data.profile?.full_name
				? `Portfolio ${data.profile.full_name} — Web Developer & IT Support${data.profile.location ? ` di ${data.profile.location}` : ' di Indonesia'}.`
				: '')
	);

	let socialLinks = $derived(
		[data.profile?.social_linkedin, data.profile?.social_github, data.profile?.social_instagram].filter(
			(url) => url && url !== 'https://github.com'
		)
	);

	let personJsonLd = $derived({
		'@context': 'https://schema.org',
		'@type': 'Person',
		name: data.profile?.full_name,
		alternateName: brandHandle || undefined,
		url: data.canonicalUrl,
		image: data.profile?.avatar_url || undefined,
		jobTitle: data.profile?.title || undefined,
		description: data.profile?.summary_paragraph || undefined,
		address: data.profile?.location ? { '@type': 'PostalAddress', addressLocality: data.profile.location } : undefined,
		knowsAbout: ['Web Development', 'IT Support', 'Network Administration'],
		sameAs: socialLinks.length ? socialLinks : undefined
	});

	// Purely decorative CSS variants for the hero carousel — cycled by index
	// since they're a visual treatment, not real project data.
	const HERO_STYLES = [
		{ class: 'card-marble', inner: 'marble' },
		{ class: 'card-mesh-1', inner: 'mesh' },
		{ class: 'card-project-dark', inner: null },
		{ class: 'card-mesh-2', inner: 'mesh' },
		{ class: 'card-project-dark-2', inner: null },
		{ class: 'card-mesh-3', inner: 'mesh' }
	];
	const HUE_STYLES = ['', 'style-hue-1', 'style-hue-2', 'style-hue-3'];

	function projectTags(project) {
		return (project.project_tags ?? []).map((pt) => pt.tags?.label).filter(Boolean);
	}

	function formatDateRange(start, end) {
		const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '');
		if (!start) return '';
		return end ? `${fmt(start)} - ${fmt(end)}` : `${fmt(start)} - Present`;
	}

	let heroCards = $derived(
		data.featuredProjects.map((p, i) => ({
			...HERO_STYLES[i % HERO_STYLES.length],
			tags: projectTags(p),
			headline: p.title
		}))
	);

	let summaryCards = $derived(
		data.experience.map((e, i) => ({
			role: `as ${e.role_title}`,
			date: formatDateRange(e.date_start, e.date_end),
			img: e.image_url || null,
			alt: e.role_title,
			hue: HUE_STYLES[i % HUE_STYLES.length]
		}))
	);

	let stats = $derived(data.stats.map((s) => ({ target: s.value, label: s.label })));

	let experience = $derived(
		data.experience.map((e, i) => ({
			side: i % 2 === 0 ? 'exp-above' : 'exp-below',
			role: e.role_title,
			type: e.role_type,
			company: e.company_name,
			date: formatDateRange(e.date_start, e.date_end)
		}))
	);

	let skills = $derived(data.skills.map((s) => s.name));

	let projects = $derived(
		data.featuredProjects.map((p, i) => ({
			img: p.thumbnail_url || null,
			hue: HUE_STYLES[i % HUE_STYLES.length],
			alt: p.title,
			tags: projectTags(p),
			title: p.title
		}))
	);

	// --- element refs ---
	let heroTrackEl;
	let summaryTrackEl;
	let projectsTrackEl;
	let statsGridEl;
	let expScrollInnerEl;
	let expHLineEl;
	let expLineFillEl;
	let expDotEls = [];

	let summaryActiveRole = $state(summaryCards[0]?.role ?? '');
	let summaryActiveDate = $state(summaryCards[0]?.date ?? '');
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
				const newRole = secondCard.getAttribute('data-role') || '';
				const newDate = secondCard.getAttribute('data-date') || '';
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
							// Fixed step count rather than "+1 per tick" — a
							// decimal target (e.g. 2.8 years) needs fractional
							// increments to animate smoothly instead of
							// counting 1, 2, 3 and only snapping down to 2.8
							// on the very last frame.
							const duration = 1500;
							const steps = 30;
							const stepTime = Math.max(16, Math.floor(duration / steps));
							const increment = stat.target / steps;
							let current = 0;
							let tick = 0;
							const timer = setInterval(() => {
								tick += 1;
								current += increment;
								if (tick >= steps || current >= stat.target) {
									statValues[i] = stat.target;
									clearInterval(timer);
								} else {
									statValues[i] = Math.round(current * 10) / 10;
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
	<title>{seoTitle}</title>
	{#if seoDescription}<meta name="description" content={seoDescription} />{/if}
	<link rel="canonical" href={data.canonicalUrl} />

	<meta property="og:type" content="profile" />
	<meta property="og:title" content={seoTitle} />
	{#if seoDescription}<meta property="og:description" content={seoDescription} />{/if}
	<meta property="og:url" content={data.canonicalUrl} />
	<meta property="og:locale" content="id_ID" />
	{#if data.profile?.avatar_url}<meta property="og:image" content={data.profile.avatar_url} />{/if}

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={seoTitle} />
	{#if seoDescription}<meta name="twitter:description" content={seoDescription} />{/if}
	{#if data.profile?.avatar_url}<meta name="twitter:image" content={data.profile.avatar_url} />{/if}

	{#if data.profile?.full_name}
		{@html jsonLdScriptTag(personJsonLd)}
	{/if}

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
						{#if data.profile?.avatar_url}
							<img src={data.profile.avatar_url} alt={data.profile?.full_name ?? ''} class="avatar-img" />
						{/if}
					</div>
					<div class="profile-text-details">
						<h1 class="profile-name">{(data.profile?.full_name ?? '').toUpperCase()}</h1>
						<p class="profile-title">{data.profile?.title ?? ''}</p>
						{#if data.profile?.location}
							<p class="profile-location"><i class="fa-solid fa-location-dot"></i> {data.profile.location}</p>
						{/if}
					</div>
				</div>

				<div class="profile-right">
					<div class="social-icons-row">
						{#if data.profile?.social_linkedin}
							<a href={data.profile.social_linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn" class="github-circle-btn"
								><i class="fa-brands fa-linkedin-in"></i></a
							>
						{/if}
						{#if data.profile?.email}
							<a href={`mailto:${data.profile.email}`} aria-label="Email" class="github-circle-btn"
								><i class="fa-solid fa-envelope"></i></a
							>
						{/if}
						{#if data.profile?.social_github && data.profile.social_github !== 'https://github.com'}
							<a href={data.profile.social_github} target="_blank" rel="noreferrer" aria-label="GitHub" class="github-circle-btn"
								><i class="fa-brands fa-github"></i></a
							>
						{/if}
						{#if data.profile?.social_instagram}
							<a href={data.profile.social_instagram} target="_blank" rel="noreferrer" aria-label="Instagram" class="github-circle-btn"
								><i class="fa-brands fa-instagram"></i></a
							>
						{/if}
					</div>
					<div class="document-links-row">
						{#if data.profile?.cv_url}
							<a href="{data.profile.cv_url}?download=CV.pdf" download="CV.pdf" class="doc-link">Curriculum Vitae</a>
						{/if}
						{#if data.profile?.resume_url}
							<a href="{data.profile.resume_url}?download=Resume.pdf" download="Resume.pdf" class="doc-link">Resume</a>
						{/if}
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
					{#if data.profile?.summary_paragraph}
						<p class="summary-paragraph">{data.profile.summary_paragraph}</p>
					{/if}
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
									{#if card.img}<img src={card.img} alt={card.alt} class="summary-card-img {card.hue}" />{/if}
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
								{#if project.img}<img src={project.img} alt={project.alt} class="proj-img {project.hue}" />{/if}
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
