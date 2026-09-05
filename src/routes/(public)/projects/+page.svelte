<script>
	import { onMount } from 'svelte';
	import '$lib/styles/projects.css';
	import ParticleHeadHero from '$lib/components/ParticleHeadHero.svelte';
	import { scrambleText } from '$lib/utils/scrambleText.js';

	let { data } = $props();
	let cards = $derived(
		data.projects.map((p) => ({
			slug: p.slug,
			title: p.title,
			role: p.role,
			duration: p.duration,
			category: p.category,
			thumbnail: p.thumbnail_url || '/assets/card_header_bg.png'
		}))
	);

	// --- Hero: letter-by-letter headline + scrambled-glyph stat counters ---
	const HERO_HEADLINE = 'SELECTED WORK';
	const heroLetters = HERO_HEADLINE.split('');
	let heroRevealed = $state(false);

	let heroStatProjects = $state('');
	let heroStatCategories = $state('');

	function initHeroStats() {
		const projectCount = String(data.projects.length);
		const categoryCount = String(new Set(data.projects.map((p) => p.category).filter(Boolean)).size);

		scrambleText((v) => (heroStatProjects = v), projectCount, 900);
		scrambleText((v) => (heroStatCategories = v), categoryCount, 900);
	}

	const pages = [1, 2, 3];
	let activePage = $state(1);

	// --- Floating filter bar (ported from projects/main.js initFloatFilterBar) ---
	let floatBarEl;
	let projectsSectionEl;
	let barVisible = $state(false);
	let searchOpen = $state(false);
	let filterOpen = $state(false);
	let searchInputEl;
	let searchValue = $state('');

	const SORT_OPTIONS = ['newest', 'oldest', 'asc', 'desc'];
	const SORT_LABELS = { newest: 'Newest', oldest: 'Oldest', asc: 'A → Z', desc: 'Z → A' };
	let activeSort = $state('newest');

	const CATEGORY_OPTIONS = ['all', 'web', 'app', 'design'];
	const CATEGORY_LABELS = { all: 'All', web: 'Web', app: 'App', design: 'Design' };
	let activeCategory = $state('all');

	const TECH_OPTIONS = ['all', 'react', 'laravel', 'vue', 'nodejs', 'figma', 'mongodb', 'mysql', 'tailwind'];
	const TECH_LABELS = {
		all: 'All',
		react: 'React',
		laravel: 'Laravel',
		vue: 'Vue',
		nodejs: 'Node.js',
		figma: 'Figma',
		mongodb: 'MongoDB',
		mysql: 'MySQL',
		tailwind: 'Tailwind'
	};
	let activeTech = $state(new Set(['all']));

	let companySelect = $state('');
	let timeSelect = $state('');

	function toggleSearch() {
		searchOpen = !searchOpen;
		if (searchOpen) {
			filterOpen = false;
			queueMicrotask(() => searchInputEl?.focus());
		}
	}
	function toggleFilter() {
		filterOpen = !filterOpen;
		if (filterOpen) searchOpen = false;
	}

	function pickTech(value) {
		if (value === 'all') {
			activeTech = new Set(['all']);
			return;
		}
		const next = new Set(activeTech);
		next.delete('all');
		if (next.has(value)) next.delete(value);
		else next.add(value);
		if (next.size === 0) next.add('all');
		activeTech = next;
	}

	function resetAll() {
		activeSort = 'newest';
		activeCategory = 'all';
		activeTech = new Set(['all']);
		companySelect = '';
		timeSelect = '';
		searchValue = '';
	}

	onMount(() => {
		requestAnimationFrame(() => (heroRevealed = true));
		initHeroStats();

		const observer = new IntersectionObserver(
			(entries) => entries.forEach((entry) => (barVisible = entry.isIntersecting)),
			{ rootMargin: '0px 0px -10% 0px', threshold: 0.05 }
		);
		if (projectsSectionEl) observer.observe(projectsSectionEl);

		function onOutsideClick(e) {
			if (floatBarEl && !floatBarEl.contains(e.target) && !e.target.closest('.ffb-filter-panel, .ffb-search-popup')) {
				searchOpen = false;
				filterOpen = false;
			}
		}
		document.addEventListener('click', onOutsideClick);

		return () => {
			observer.disconnect();
			document.removeEventListener('click', onOutsideClick);
		};
	});
</script>

<svelte:head>
	<title>Hello Imanuel · Portfolio 2026</title>
	<meta name="description" content="Hello Imanuel – UI/UX Designer & Developer Portfolio 2026" />
	<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
</svelte:head>

<header class="site-header">
	<div class="hero-wrap" id="home">
		<div class="hero-grid-bg" aria-hidden="true"></div>
		<ParticleHeadHero />

		<div class="hero-copy">
			<h1 class="hero-headline" class:revealed={heroRevealed}>
				{#each heroLetters as letter, i (i)}
					<span class="hero-letter" style="transition-delay: {i * 28}ms">{letter === ' ' ? ' ' : letter}</span>
				{/each}
			</h1>
		</div>

		<div class="hero-stats">
			<div class="hero-stat hero-stat-left">
				<span class="hero-stat-value">{heroStatProjects}+</span>
				<span class="hero-stat-label">PROJECTS SHIPPED</span>
			</div>
			<div class="hero-stat hero-stat-right">
				<span class="hero-stat-value">{heroStatCategories}</span>
				<span class="hero-stat-label">CATEGORIES</span>
			</div>
		</div>
	</div>
</header>

<section class="projects-section" id="project" bind:this={projectsSectionEl}>
	<section class="cards-grid-container">
		{#each cards as card}
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
	</section>

	<div class="pagination-container">
		<a href="#" class="page-link page-prev" aria-label="Previous page"><span class="page-link-text">Prev</span></a>
		{#each pages as p}
			<a href="#" class="page-link" class:active={p === activePage} onclick={(e) => { e.preventDefault(); activePage = p; }}>{p}</a>
		{/each}
		<a href="#" class="page-link page-next" aria-label="Next page"><span class="page-link-text">Next</span></a>
	</div>
</section>

<!-- Floating Filter Bar -->
<div class="float-filter-bar" class:show={barVisible} bind:this={floatBarEl}>
	<button class="ffb-btn ffb-search" class:active={searchOpen} title="Search projects" onclick={toggleSearch}>
		<i class="fa-solid fa-magnifying-glass"></i>
		<span class="ffb-label">Search</span>
	</button>

	<div class="ffb-divider"></div>

	<button class="ffb-btn ffb-filter" class:active={filterOpen} title="Filter projects" onclick={toggleFilter}>
		<i class="fa-solid fa-sliders"></i>
		<span class="ffb-label">Filter</span>
	</button>
</div>

<div class="ffb-search-popup" class:open={searchOpen}>
	<input
		type="text"
		class="ffb-search-input"
		placeholder="Search projects..."
		bind:this={searchInputEl}
		bind:value={searchValue}
	/>
</div>

<div class="ffb-filter-panel" class:open={filterOpen}>
	<div class="ffp-header">
		<span class="ffp-title"><i class="fa-solid fa-sliders"></i> Filter Projects</span>
		<button class="ffp-reset" onclick={resetAll}>Reset All</button>
	</div>

	<div class="ffp-group">
		<label class="ffp-label" for="sort-chips">Sort By</label>
		<div class="ffp-chips" id="sort-chips">
			{#each SORT_OPTIONS as opt}
				<button class="ffp-chip" class:active={activeSort === opt} onclick={() => (activeSort = opt)}>{SORT_LABELS[opt]}</button>
			{/each}
		</div>
	</div>

	<div class="ffp-group">
		<label class="ffp-label" for="cat-chips">Category</label>
		<div class="ffp-chips" id="cat-chips">
			{#each CATEGORY_OPTIONS as opt}
				<button class="ffp-chip" class:active={activeCategory === opt} onclick={() => (activeCategory = opt)}>{CATEGORY_LABELS[opt]}</button>
			{/each}
		</div>
	</div>

	<div class="ffp-group">
		<label class="ffp-label" for="ffpCompanySelect">Company / Client</label>
		<select class="ffp-select" id="ffpCompanySelect" bind:value={companySelect}>
			<option value="">All Companies</option>
			<option value="uksw">Universitas Kristen Satya Wacana</option>
			<option value="smk">SMK Kristen 5 Klaten</option>
			<option value="personal">Personal Project</option>
		</select>
	</div>

	<div class="ffp-group">
		<label class="ffp-label" for="ffpTimeSelect">Time Period</label>
		<select class="ffp-select" id="ffpTimeSelect" bind:value={timeSelect}>
			<option value="">All Time</option>
			<option value="2024">2024</option>
			<option value="2023">2023</option>
			<option value="2022">2022</option>
		</select>
	</div>

	<div class="ffp-group">
		<label class="ffp-label" for="tech-chips">Tech Stack</label>
		<div class="ffp-chips ffp-chips-multi" id="tech-chips">
			{#each TECH_OPTIONS as opt}
				<button class="ffp-chip" class:active={activeTech.has(opt)} onclick={() => pickTech(opt)}>{TECH_LABELS[opt]}</button>
			{/each}
		</div>
	</div>
</div>
