<script>
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { getDictionary } from '$lib/i18n';
	import { LOCALES } from '$lib/i18n/locales';

	/**
	 * Ported 1:1 from the static site's components/navbar.js.
	 * Theme is derived from the route instead of passed as a prop, since it
	 * mapped 1:1 to page identity in the original (dark on Home, default on
	 * the Projects listing, light on a Project detail page) — see navbar.css
	 * for what each variant changes.
	 */
	let { locale = 'id' } = $props();
	// Set the instant a flag is clicked, before the page navigation that
	// actually applies it even starts — makes the switch feel immediate
	// (the whole navbar flips to the target language right away) instead of
	// a silent redirect the user has to squint at to confirm happened.
	// `locale` itself doesn't change until the real reload lands with a
	// fresh `data.locale` from the server, which is what actually matters
	// for the rest of the page (and is unaffected by this).
	let switchingTo = $state(null);
	let effectiveLocale = $derived(switchingTo ?? locale);
	let t = $derived(getDictionary(effectiveLocale));

	let NAV_LINKS = $derived([
		{ label: t.nav.home, anchor: null, unavailable: false },
		{ label: t.nav.projects, anchor: 'project', unavailable: false },
		{ label: t.nav.articles, anchor: 'others', unavailable: true },
		{ label: t.nav.messages, anchor: 'others', unavailable: true },
		{ label: t.nav.contact, anchor: 'contact', unavailable: false }
	]);
	const SECTION_IDS = ['home', 'summary', 'experience', 'project', 'projects', 'contact', 'messages', 'others'];

	function currentPath() {
		return $page.url.pathname + $page.url.search;
	}
	function setLocaleHref(code) {
		return `/api/set-locale?locale=${code}&redirect=${encodeURIComponent(currentPath())}`;
	}

	/**
	 * The <a href> alone (data-sveltekit-reload) already works and stays as
	 * the real fallback — a plain link, so it degrades correctly with JS
	 * off, and a modifier-click (ctrl/cmd/middle-click) still opens it in a
	 * new tab like any normal link, untouched by this. On an ordinary left
	 * click, drive the navigation explicitly via location.href instead of
	 * leaving it to the browser's default click-through — a plain
	 * assignment is as close to unblockable as navigation gets, so this
	 * reload can't silently get lost to any click-handling quirk between
	 * here and the browser actually following the link.
	 */
	function switchLocale(e, code) {
		if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
		e.preventDefault();
		switchingTo = code;
		langMenuOpen = false;
		window.location.href = setLocaleHref(code);
	}

	let onHomePage = $derived($page.url.pathname === '/');
	let onProjectsPage = $derived($page.url.pathname === '/projects');
	let onDetailPage = $derived($page.url.pathname.startsWith('/projects/'));
	let theme = $derived(onHomePage ? 'dark' : onDetailPage ? 'light' : undefined);
	let navClass = $derived(
		theme === 'dark' ? 'navbar navbar--on-dark' : theme === 'light' ? 'navbar navbar--on-light' : 'navbar'
	);
	let homeActive = $derived(!onProjectsPage);

	function linkHref(link) {
		return onProjectsPage ? `#${link.anchor}` : `/projects#${link.anchor}`;
	}

	let navEl;
	let hamburgerOpen = $state(false);
	let scrolled = $state(false);
	let navHidden = $state(false);
	let showModal = $state(false);
	let activeSection = $state('');
	let langMenuOpen = $state(false);

	function toggleHamburger() {
		hamburgerOpen = !hamburgerOpen;
	}
	function closeMenu() {
		hamburgerOpen = false;
		langMenuOpen = false;
	}
	function toggleLangMenu(e) {
		e.stopPropagation();
		langMenuOpen = !langMenuOpen;
	}
	function handleUnavailableClick(e) {
		e.preventDefault();
		closeMenu();
		showModal = true;
	}
	function closeModal() {
		showModal = false;
	}
	function handleBackdropClick(e) {
		if (e.target === e.currentTarget) closeModal();
	}

	onMount(() => {
		let lastScrollY = window.scrollY;
		const SCROLL_THRESHOLD = 10;

		function onScroll() {
			const currentScrollY = window.scrollY;
			scrolled = currentScrollY > 50;

			const diff = currentScrollY - lastScrollY;
			if (diff > SCROLL_THRESHOLD && currentScrollY > 68) {
				navHidden = true;
			} else if (diff < -SCROLL_THRESHOLD || currentScrollY <= 68) {
				navHidden = false;
			}
			lastScrollY = currentScrollY;

			let current = '';
			for (const id of SECTION_IDS) {
				const el = document.getElementById(id);
				if (el && currentScrollY >= el.offsetTop - 80) current = id;
			}
			activeSection = current;
		}

		function onOutsideClick(e) {
			if (navEl && !navEl.contains(e.target)) closeMenu();
		}

		function onKeydown(e) {
			if (e.key === 'Escape') {
				closeModal();
				langMenuOpen = false;
			}
		}

		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		document.addEventListener('click', onOutsideClick);
		document.addEventListener('keydown', onKeydown);

		return () => {
			window.removeEventListener('scroll', onScroll);
			document.removeEventListener('click', onOutsideClick);
			document.removeEventListener('keydown', onKeydown);
		};
	});
</script>

{#snippet flagSvg(code)}
	{#if code === 'id'}
		<svg class="flag-icon" viewBox="0 0 24 16" width="22" height="15" xmlns="http://www.w3.org/2000/svg">
			<rect width="24" height="8" fill="#CE1126" />
			<rect y="8" width="24" height="8" fill="#FFFFFF" />
			<rect width="24" height="16" fill="none" stroke="rgba(0,0,0,0.12)" stroke-width="1" />
		</svg>
	{:else}
		<svg class="flag-icon" viewBox="0 0 24 16" width="22" height="15" xmlns="http://www.w3.org/2000/svg">
			<rect width="24" height="16" fill="#B22234" />
			<rect y="1.23" width="24" height="1.23" fill="#FFFFFF" />
			<rect y="3.69" width="24" height="1.23" fill="#FFFFFF" />
			<rect y="6.15" width="24" height="1.23" fill="#FFFFFF" />
			<rect y="8.62" width="24" height="1.23" fill="#FFFFFF" />
			<rect y="11.08" width="24" height="1.23" fill="#FFFFFF" />
			<rect y="13.54" width="24" height="1.23" fill="#FFFFFF" />
			<rect width="10" height="8.62" fill="#3C3B6E" />
			<rect width="24" height="16" fill="none" stroke="rgba(0,0,0,0.12)" stroke-width="1" />
		</svg>
	{/if}
{/snippet}

<!-- One switcher definition, rendered twice (mobile dropdown + desktop bar)
     — same duplication shape the rest of this file already uses for the
     language row, just de-duplicated via a snippet instead of copy-pasted
     markup. `extraClass` carries navbar-language-desktop so the existing
     CSS (hides it on mobile, shows the .navbar-language-item copy instead)
     keeps working unchanged. -->
{#snippet langSwitcher(extraClass)}
	<div class="navbar-language-wrap">
		<button
			type="button"
			class="navbar-language {extraClass}"
			aria-haspopup="true"
			aria-expanded={langMenuOpen}
			onclick={toggleLangMenu}
		>
			{@render flagSvg(effectiveLocale)}
			<span class="lang-text">{t.nav.language}</span>
		</button>
		{#if langMenuOpen}
			<ul class="navbar-language-menu">
				{#each LOCALES as loc (loc.code)}
					<li>
						<a
							href={setLocaleHref(loc.code)}
							class="navbar-language-option"
							class:active={loc.code === effectiveLocale}
							data-sveltekit-reload
							onclick={(e) => switchLocale(e, loc.code)}
						>
							{@render flagSvg(loc.code)}
							<span>{loc.label}</span>
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
{/snippet}

<nav bind:this={navEl} id="navbar" class={navClass} class:scrolled class:hidden={navHidden}>
	<a href="/" class="navbar-logo" data-sveltekit-reload={onHomePage ? undefined : true}>helloimanuel.</a>

	<ul class="navbar-links" class:open={hamburgerOpen} id="navLinks">
		{#each NAV_LINKS as link}
			{#if link.anchor === null}
				<li>
					<a
						href="/"
						class:active={homeActive}
						data-sveltekit-reload={onHomePage ? undefined : true}
						onclick={closeMenu}
					>
						{link.label}
					</a>
				</li>
			{:else if link.unavailable}
				<li>
					<!-- svelte-ignore a11y_invalid_attribute -- JS-only action (shows a modal), href="#" keeps it keyboard-focusable -->
					<a href="#" data-unavailable="true" onclick={handleUnavailableClick}>{link.label}</a>
				</li>
			{:else}
				<li>
					<a
						href={linkHref(link)}
						class:active={onProjectsPage && activeSection === link.anchor}
						data-sveltekit-reload={onProjectsPage ? undefined : true}
						onclick={closeMenu}
					>
						{link.label}
					</a>
				</li>
			{/if}
		{/each}
		<li class="navbar-language-item">
			{@render langSwitcher('')}
		</li>
	</ul>

	<div class="navbar-right">
		{@render langSwitcher('navbar-language-desktop')}

		<button class="navbar-hamburger" class:open={hamburgerOpen} aria-label="Toggle menu" onclick={toggleHamburger}>
			<span></span>
			<span></span>
			<span></span>
		</button>
	</div>
</nav>

{#if showModal}
	<div class="navbar-info-modal show" role="presentation" onclick={handleBackdropClick}>
		<div class="navbar-info-modal-card">
			<div class="navbar-info-modal-icon"><i class="fa-solid fa-screwdriver-wrench"></i></div>
			<p class="navbar-info-modal-message">{t.nav.unavailableMessage}</p>
			<button class="navbar-info-modal-close" type="button" onclick={closeModal}>{t.nav.ok}</button>
		</div>
	</div>
{/if}
