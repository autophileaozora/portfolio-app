<script>
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	/**
	 * Ported 1:1 from the static site's components/navbar.js.
	 * Theme is derived from the route instead of passed as a prop, since it
	 * mapped 1:1 to page identity in the original (dark on Home, default on
	 * the Projects listing, light on a Project detail page) — see navbar.css
	 * for what each variant changes.
	 */
	const NAV_LINKS = [
		{ label: 'HOME', anchor: null, unavailable: false },
		{ label: 'PROJECTS', anchor: 'project', unavailable: false },
		{ label: 'ARTICLES', anchor: 'others', unavailable: true },
		{ label: 'MESSAGES', anchor: 'others', unavailable: true },
		{ label: 'CONTACT', anchor: 'contact', unavailable: false }
	];
	const UNAVAILABLE_MESSAGE = 'Maaf, fitur sedang dikembangkan.';
	const SECTION_IDS = ['home', 'summary', 'experience', 'project', 'projects', 'contact', 'messages', 'others'];

	let onProjectsPage = $derived($page.url.pathname === '/projects');
	let onDetailPage = $derived($page.url.pathname.startsWith('/projects/'));
	let theme = $derived($page.url.pathname === '/' ? 'dark' : onDetailPage ? 'light' : undefined);
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

	function toggleHamburger() {
		hamburgerOpen = !hamburgerOpen;
	}
	function closeMenu() {
		hamburgerOpen = false;
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
			if (e.key === 'Escape') closeModal();
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

<nav bind:this={navEl} id="navbar" class={navClass} class:scrolled class:hidden={navHidden}>
	<a href="/" class="navbar-logo" data-sveltekit-reload={onProjectsPage ? true : undefined}>helloimanuel.</a>

	<ul class="navbar-links" class:open={hamburgerOpen} id="navLinks">
		{#each NAV_LINKS as link}
			{#if link.label === 'HOME'}
				<li>
					<a href="/" class:active={homeActive} onclick={closeMenu}>HOME</a>
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
			<div
				class="navbar-language"
				data-unavailable="true"
				role="button"
				tabindex="0"
				onclick={handleUnavailableClick}
				onkeydown={(e) => e.key === 'Enter' && handleUnavailableClick(e)}
			>
				<svg class="flag-icon" viewBox="0 0 24 16" width="22" height="15" xmlns="http://www.w3.org/2000/svg">
					<rect width="24" height="8" fill="#CE1126" />
					<rect y="8" width="24" height="8" fill="#FFFFFF" />
					<rect width="24" height="16" fill="none" stroke="rgba(0,0,0,0.12)" stroke-width="1" />
				</svg>
				<span class="lang-text">LANGUAGE</span>
			</div>
		</li>
	</ul>

	<div class="navbar-right">
		<div
			class="navbar-language navbar-language-desktop"
			data-unavailable="true"
			role="button"
			tabindex="0"
			onclick={handleUnavailableClick}
			onkeydown={(e) => e.key === 'Enter' && handleUnavailableClick(e)}
		>
			<svg class="flag-icon" viewBox="0 0 24 16" width="22" height="15" xmlns="http://www.w3.org/2000/svg">
				<rect width="24" height="8" fill="#CE1126" />
				<rect y="8" width="24" height="8" fill="#FFFFFF" />
				<rect width="24" height="16" fill="none" stroke="rgba(0,0,0,0.12)" stroke-width="1" />
			</svg>
			<span class="lang-text">LANGUAGE</span>
		</div>

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
			<p class="navbar-info-modal-message">{UNAVAILABLE_MESSAGE}</p>
			<button class="navbar-info-modal-close" type="button" onclick={closeModal}>Oke, Mengerti</button>
		</div>
	</div>
{/if}
