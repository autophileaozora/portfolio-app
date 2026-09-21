<script>
	import { onMount } from 'svelte';
	import '$lib/styles/projects.css';
	import VantaRingsBackground from '$lib/components/VantaRingsBackground.svelte';
	import { formatDuration } from '$lib/utils/formatDuration.js';
	import { getDictionary } from '$lib/i18n';

	let { data } = $props();
	let t = $derived(getDictionary(data.locale));

	let brandHandle = $derived(data.profile?.email ? data.profile.email.split('@')[0] : '');
	let seoTitle = $derived(
		data.profile?.full_name
			? `Portfolio ${data.profile.full_name}${brandHandle ? ` (${brandHandle})` : ''} — Web Developer & IT Support`
			: 'Portfolio'
	);
	let seoDescription = $derived(
		data.profile?.full_name
			? `Kumpulan project ${data.profile.full_name} sebagai Web Developer & IT Support${data.profile.location ? ` di ${data.profile.location}` : ''}.`
			: ''
	);
	let shareImage = $derived(data.seoSettings?.og_image_url || data.profile?.avatar_url || null);
	let siteName = $derived(data.seoSettings?.site_name || data.profile?.full_name || undefined);

	// --- Floating filter bar (ported from projects/main.js initFloatFilterBar) ---
	let floatBarEl;
	let projectsSectionEl;
	let barVisible = $state(false);
	let searchOpen = $state(false);
	let filterOpen = $state(false);
	let searchInputEl;
	let searchValue = $state('');

	const SORT_OPTIONS = ['newest', 'oldest', 'asc', 'desc'];
	let SORT_LABELS = $derived(t.projectsListing.sortLabels);
	let activeSort = $state('newest');

	const CATEGORY_OPTIONS = ['all', 'web', 'app', 'design'];
	let CATEGORY_LABELS = $derived(t.projectsListing.categoryLabels);
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
	<title>{seoTitle}</title>
	{#if seoDescription}<meta name="description" content={seoDescription} />{/if}
	<link rel="canonical" href={data.canonicalUrl} />

	<meta property="og:type" content="website" />
	<meta property="og:title" content={seoTitle} />
	{#if seoDescription}<meta property="og:description" content={seoDescription} />{/if}
	<meta property="og:url" content={data.canonicalUrl} />
	<meta property="og:locale" content="id_ID" />
	{#if siteName}<meta property="og:site_name" content={siteName} />{/if}
	{#if shareImage}<meta property="og:image" content={shareImage} />{/if}

	<meta name="twitter:card" content={shareImage ? 'summary_large_image' : 'summary'} />
	<meta name="twitter:title" content={seoTitle} />
	{#if seoDescription}<meta name="twitter:description" content={seoDescription} />{/if}
	{#if shareImage}<meta name="twitter:image" content={shareImage} />{/if}

	<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
</svelte:head>

<header class="site-header">
	<div class="hero-wrap" id="home">
		<!-- Purely decorative animated background — the actual page topic
		     still needs a real, crawlable <h1> for SEO/screen readers, just
		     not rendered visually on top of the animation. -->
		<h1 class="sr-only">{seoTitle}</h1>
		<VantaRingsBackground />
	</div>
</header>

<main>
<section class="projects-section" id="project" bind:this={projectsSectionEl}>
	<section class="cards-grid-container">
		{#each cards as card}
			<div class="card-wrapper">
				<div class="card-header">
					<a href="/projects/{card.slug}" class="card-arrow-btn" aria-label={t.common.viewProjectAria} data-sveltekit-reload>
						<img src="/assets/arrow_button.png" alt="Arrow" class="arrow-icon" />
					</a>
					<a
						href="/projects/{card.slug}"
						class="thumbnail-wrapper"
						aria-label={t.common.viewProjectWithTitleAria(card.title)}
						data-sveltekit-reload
					>
						{#if card.thumbnail}
							<img src={card.thumbnail} alt="{card.title} Preview" class="card-thumbnail" />
						{/if}
					</a>
				</div>

				<article class="project-card">
					<h3 class="card-title">
						<a href="/projects/{card.slug}" data-sveltekit-reload>{card.title}</a>
					</h3>
					<div class="card-meta">
						<div class="meta-row">
							<span class="meta-label">{t.common.role}</span>
							<span class="meta-value">{card.role}</span>
						</div>
						<div class="divider"></div>
						<div class="meta-row">
							<span class="meta-label">{t.common.duration}</span>
							<span class="meta-value">{card.duration}</span>
						</div>
						<div class="divider"></div>
						<div class="meta-row">
							<span class="meta-label">{t.common.categories}</span>
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
			<p class="no-projects-found">{t.projectsListing.noProjectsFound}</p>
		{/each}
	</section>

	{#if pages.length > 1}
		<div class="pagination-container">
			<button
				type="button"
				class="page-link page-prev"
				aria-label={t.projectsListing.prevAria}
				disabled={activePage === 1}
				onclick={() => {
					if (activePage > 1) activePage -= 1;
				}}><span class="page-link-text">{t.projectsListing.prev}</span></button
			>
			{#each pages as p}
				<button type="button" class="page-link" class:active={p === activePage} onclick={() => (activePage = p)}
					>{p}</button
				>
			{/each}
			<button
				type="button"
				class="page-link page-next"
				aria-label={t.projectsListing.nextAria}
				disabled={activePage === totalPages}
				onclick={() => {
					if (activePage < totalPages) activePage += 1;
				}}><span class="page-link-text">{t.projectsListing.next}</span></button
			>
		</div>
	{/if}
</section>
</main>

<!-- Floating Filter Bar -->
<div class="float-filter-bar" class:show={barVisible} bind:this={floatBarEl}>
	<button class="ffb-btn ffb-search" class:active={searchOpen} title={t.projectsListing.searchLabel} onclick={toggleSearch}>
		<i class="fa-solid fa-magnifying-glass"></i>
		<span class="ffb-label">{t.projectsListing.searchLabel}</span>
	</button>

	<div class="ffb-divider"></div>

	<button class="ffb-btn ffb-filter" class:active={filterOpen} title={t.projectsListing.filterLabel} onclick={toggleFilter}>
		<i class="fa-solid fa-sliders"></i>
		<span class="ffb-label">{t.projectsListing.filterLabel}</span>
	</button>
</div>

<div class="ffb-search-popup" class:open={searchOpen}>
	<input
		type="text"
		class="ffb-search-input"
		placeholder={t.projectsListing.searchPlaceholder}
		bind:this={searchInputEl}
		bind:value={searchValue}
	/>
</div>

<div class="ffb-filter-panel" class:open={filterOpen}>
	<div class="ffp-header">
		<span class="ffp-title"><i class="fa-solid fa-sliders"></i> {t.projectsListing.filterProjectsTitle}</span>
		<button class="ffp-reset" onclick={resetAll}>{t.projectsListing.resetAll}</button>
	</div>

	<div class="ffp-group">
		<label class="ffp-label" for="sort-chips">{t.projectsListing.sortBy}</label>
		<div class="ffp-chips" id="sort-chips">
			{#each SORT_OPTIONS as opt}
				<button class="ffp-chip" class:active={activeSort === opt} onclick={() => (activeSort = opt)}>{SORT_LABELS[opt]}</button>
			{/each}
		</div>
	</div>

	<div class="ffp-group">
		<label class="ffp-label" for="cat-chips">{t.projectsListing.category}</label>
		<div class="ffp-chips" id="cat-chips">
			{#each CATEGORY_OPTIONS as opt}
				<button class="ffp-chip" class:active={activeCategory === opt} onclick={() => (activeCategory = opt)}>{CATEGORY_LABELS[opt]}</button>
			{/each}
		</div>
	</div>

</div>
