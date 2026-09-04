<script>
	import { onMount, onDestroy } from 'svelte';
	import '$lib/styles/project-detail.css';

	let { data } = $props();

	let project = $derived({
		title: data.project.title,
		contributors: data.project.contributors,
		associatedWith: data.project.associated_with,
		category: data.project.category,
		dates: formatDateRange(data.project.date_start, data.project.date_end),
		role: data.project.role,
		description: data.project.short_description,
		liveUrl: data.project.live_url,
		tags: (data.project.project_tags ?? []).map((pt) => pt.tags?.label).filter(Boolean)
	});

	function formatDateRange(start, end) {
		const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '');
		if (!start) return '';
		return end ? `${fmt(start)} - ${fmt(end)}` : `${fmt(start)} - Present`;
	}

	function sectionsByType(type) {
		return (data.project.project_sections ?? [])
			.filter((s) => s.type === type)
			.sort((a, b) => a.display_order - b.display_order);
	}

	let sections = $derived(
		[...sectionsByType('problem'), ...sectionsByType('solution'), ...sectionsByType('result')].map((s) => ({
			heading: s.title,
			body: s.content
		}))
	);

	let docSlides = $derived(sectionsByType('documentation').map((s) => ({ title: s.title, body: s.content })));

	let otherProjects = $derived(
		data.otherProjects.map((p) => ({
			slug: p.slug,
			title: p.title,
			role: p.role,
			duration: p.duration,
			category: p.category,
			thumbnail: p.thumbnail_url || '/assets/card_header_bg.png'
		}))
	);

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
		if (!docSlides.length) return;
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

	{#if project.liveUrl}
		<a href={project.liveUrl} target="_blank" rel="noreferrer" class="cta-button">SEE LIVE PROJECT &rarr;</a>
	{/if}

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
						<a href="/projects/{card.slug}" class="card-arrow-btn" aria-label="Lihat Project" data-sveltekit-reload>
							<img src="/assets/arrow_button.png" alt="Arrow" class="arrow-icon" />
						</a>
						<div class="thumbnail-wrapper">
							<img src={card.thumbnail} alt="{card.title} Preview" class="card-thumbnail" />
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
