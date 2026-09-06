<script>
	import { onMount, onDestroy } from 'svelte';
	import '$lib/styles/project-detail.css';
	import { formatDuration } from '$lib/utils/formatDuration.js';

	let { data } = $props();

	let project = $derived({
		title: data.project.title,
		contributors: data.project.contributors_list ?? [],
		associatedWith: data.project.associated_with,
		category: data.project.category,
		dates: formatDateRange(data.project.date_start, data.project.date_end),
		duration: formatDuration(data.project.date_start, data.project.date_end),
		role: data.project.role,
		description: data.project.short_description,
		liveUrl: data.project.live_url,
		tags: (data.project.project_tags ?? []).map((pt) => pt.tags?.label).filter(Boolean)
	});

	let seoTitle = $derived(
		data.project.meta_title ||
			(data.profile?.full_name ? `${data.project.title} — ${data.profile.full_name}` : data.project.title)
	);
	let seoDescription = $derived(
		data.project.meta_description || data.project.short_description || `Project: ${data.project.title}`
	);

	// JSON-LD tag for the head, built for two reasons neither of which is
	// obvious from a plain template string:
	// 1) json.stringify does not escape closing-tag-like sequences, so a
	//    description containing one verbatim would break out of the tag —
	//    escaping every angle bracket as a unicode sequence (still valid
	//    JSON, decodes back to the same string) closes that off.
	// 2) the opening/closing tag names are built via concat, not written
	//    out whole, because a literal occurrence elsewhere in this file
	//    previously confused the Svelte compiler's own tag scanning.
	function jsonLdScriptTag(obj) {
		const json = JSON.stringify(obj).replace(/</g, '\\u003c');
		const open = '<' + 'script type="application/ld+json">';
		const close = '<' + '/script>';
		return open + json + close;
	}

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

	let docSlides = $derived(
		sectionsByType('documentation').map((s) => ({ title: s.title, body: s.content, image: s.image_url }))
	);

	let otherProjects = $derived(
		data.otherProjects.map((p) => ({
			slug: p.slug,
			title: p.title,
			role: p.role,
			duration: formatDuration(p.date_start, p.date_end),
			category: p.category,
			thumbnail: p.thumbnail_url || null
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
	<title>{seoTitle}</title>
	<meta name="description" content={seoDescription} />
	<link rel="canonical" href={data.canonicalUrl} />

	<meta property="og:type" content="article" />
	<meta property="og:title" content={seoTitle} />
	<meta property="og:description" content={seoDescription} />
	<meta property="og:url" content={data.canonicalUrl} />
	{#if data.ogImage}<meta property="og:image" content={data.ogImage} />{/if}

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={seoTitle} />
	<meta name="twitter:description" content={seoDescription} />
	{#if data.ogImage}<meta name="twitter:image" content={data.ogImage} />{/if}

	{@html jsonLdScriptTag({
		'@context': 'https://schema.org',
		'@type': 'CreativeWork',
		name: data.project.title,
		description: seoDescription,
		image: data.ogImage ?? undefined,
		url: data.canonicalUrl,
		author: data.profile?.full_name ? { '@type': 'Person', name: data.profile.full_name } : undefined,
		datePublished: data.project.date_start ?? undefined,
		keywords: project.tags.join(', ') || undefined
	})}
</svelte:head>

<div class="container">
	<header class="hero" id="home">
		<div class="meta-row">
			<div class="meta-item">
				<div class="label">Contributor :</div>
				<div class="value">
					{#each project.contributors as c, i (i)}
						{#if c.url}<a href={c.url} target="_blank" rel="noreferrer" class="contributor-link">{c.name}</a
							>{:else}{c.name}{/if}{#if i < project.contributors.length - 1}<span>, </span>{/if}
					{:else}
						—
					{/each}
				</div>
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
				<div class="label">Duration :</div>
				<div class="value">{project.duration}</div>
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

	<div class="hero-actions">
		{#if project.liveUrl}
			<a href={project.liveUrl} target="_blank" rel="noreferrer" class="cta-button">SEE LIVE PROJECT &rarr;</a>
		{/if}
		<a href="/projects/{data.project.slug}/request-edit" class="request-edit-link">Request Edit</a>
	</div>

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
			<div
				class="carousel-slide"
				class:active={idx === currentSlide}
				style={slide.image ? `--slide-bg: url('${slide.image}')` : ''}
			>
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
			{/each}
		</div>

		<div class="op-footer">
			<a href="/projects" class="op-see-more" data-sveltekit-reload>See More Project &rarr;</a>
		</div>
	</div>
</section>

<style>
	.contributor-link {
		color: inherit;
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.hero-actions {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.request-edit-link {
		font-size: 0.85rem;
		color: inherit;
		opacity: 0.7;
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.request-edit-link:hover {
		opacity: 1;
	}
</style>
