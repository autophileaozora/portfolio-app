<script>
	import { onMount } from 'svelte';
	import '$lib/styles/projects.css';
	import VantaRingsBackground from '$lib/components/VantaRingsBackground.svelte';
	import { formatDuration } from '$lib/utils/formatDuration.js';

	let { data } = $props();

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

	// Sort/Category/Search actually filter+sort the real project list below —
	// Company/Client, Time Period and Tech Stack were removed entirely (they
	// were hardcoded example values with no real filtering behind them at
	// all — clicking any of them never changed the results).
	let filteredProjects = $derived(
		data.projects
			.filter((p) => activeCategory === 'all' || p.category === activeCategory)
			.filter((p) => {
				const q = searchValue.trim().toLowerCase();
				if (!q) return true;
				return (p.title ?? '').toLowerCase().includes(q) || (p.role ?? '').toLowerCase().includes(q);
			})
			.slice()
			.sort((a, b) => {
				if (activeSort === 'asc') return (a.title ?? '').localeCompare(b.title ?? '');
				if (activeSort === 'desc') return (b.title ?? '').localeCompare(a.title ?? '');
				const aDate = a.date_start ?? '';
				const bDate = b.date_start ?? '';
				return activeSort === 'oldest' ? aDate.localeCompare(bDate) : bDate.localeCompare(aDate);
			})
	);

	const PAGE_SIZE = 9;
	let activePage = $state(1);
	let totalPages = $derived(Math.max(1, Math.ceil(filteredProjects.length / PAGE_SIZE)));
	let pages = $derived(Array.from({ length: totalPages }, (_, i) => i + 1));

	// Snap back to page 1 whenever the filtered set changes shape, so the
	// admin never lands on an out-of-range page showing nothing.
	$effect(() => {
		const _track = [activeCategory, searchValue, activeSort];
		activePage = 1;
	});

	let cards = $derived(
		filteredProjects.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE).map((p) => ({
			slug: p.slug,
			title: p.title,
			role: p.role,
			duration: formatDuration(p.date_start, p.date_end),
			category: p.category,
			thumbnail: p.thumbnail_url || null
		}))
	);

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

	function resetAll() {
		activeSort = 'newest';
		activeCategory = 'all';
		searchValue = '';
	}

	onMount(() => {
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
		<VantaRingsBackground />
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
						{#if card.thumbnail}
							<img src={card.thumbnail} alt="{card.title} Preview" class="card-thumbnail" />
						{/if}
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
		{:else}
			<p class="no-projects-found">Tidak ada project yang cocok dengan pencarian/filter ini.</p>
		{/each}
	</section>

	{#if pages.length > 1}
		<div class="pagination-container">
			<a
				href="#"
				class="page-link page-prev"
				aria-label="Previous page"
				aria-disabled={activePage === 1}
				onclick={(e) => {
					e.preventDefault();
					if (activePage > 1) activePage -= 1;
				}}><span class="page-link-text">Prev</span></a
			>
			{#each pages as p}
				<a
					href="#"
					class="page-link"
					class:active={p === activePage}
					onclick={(e) => {
						e.preventDefault();
						activePage = p;
					}}>{p}</a
				>
			{/each}
			<a
				href="#"
				class="page-link page-next"
				aria-label="Next page"
				aria-disabled={activePage === totalPages}
				onclick={(e) => {
					e.preventDefault();
					if (activePage < totalPages) activePage += 1;
				}}><span class="page-link-text">Next</span></a
			>
		</div>
	{/if}
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

</div>
