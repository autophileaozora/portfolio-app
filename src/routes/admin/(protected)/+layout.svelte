<script>
	import '$lib/styles/admin.css';
	import { page } from '$app/stores';

	let { data, children } = $props();

	const NAV_ITEMS = [
		{ href: '/admin', label: 'Dashboard', icon: 'fa-gauge', available: true },
		{ href: '/admin/projects', label: 'Projects', icon: 'fa-diagram-project', available: true },
		{ href: '/admin/experience', label: 'Experience', icon: 'fa-briefcase', available: true },
		{ href: '/admin/skills', label: 'Skills', icon: 'fa-code', available: true },
		{ href: '/admin/testimonials', label: 'Testimonials', icon: 'fa-comment', available: true },
		{ href: '/admin/stats', label: 'Stats', icon: 'fa-chart-simple', available: true },
		{ href: '/admin/profile', label: 'Profile', icon: 'fa-user', available: true },
		{ href: '/admin/messages', label: 'Messages', icon: 'fa-envelope', available: true },
		{ href: '/admin/edit-requests', label: 'Edit Requests', icon: 'fa-pen-to-square', available: true }
	];

	const BADGE_COUNTS = {
		'/admin/messages': 'pendingMessagesCount',
		'/admin/edit-requests': 'pendingEditRequestsCount'
	};

	let pathname = $derived($page.url.pathname);
	function isActive(href) {
		return href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
	}

	// Sidebar collapses into a slide-in panel under the mobile breakpoint
	// (see the @media block below) — this only tracks whether that panel
	// is open; on desktop it has no effect (sidebar always visible there).
	let sidebarOpen = $state(false);
	function closeSidebar() {
		sidebarOpen = false;
	}
</script>

<svelte:head>
	<title>Admin</title>
</svelte:head>

<div class="admin-shell">
	<div class="admin-topbar">
		<button
			class="admin-menu-toggle"
			aria-label={sidebarOpen ? 'Tutup menu' : 'Buka menu'}
			aria-expanded={sidebarOpen}
			onclick={() => (sidebarOpen = !sidebarOpen)}
		>
			<i class="fa-solid {sidebarOpen ? 'fa-xmark' : 'fa-bars'}"></i>
		</button>
		<div class="admin-brand">Portfolio Admin</div>
	</div>

	{#if sidebarOpen}
		<button class="admin-backdrop" aria-label="Tutup menu" onclick={closeSidebar}></button>
	{/if}

	<aside class="admin-sidebar" class:open={sidebarOpen}>
		<div class="admin-brand admin-brand-desktop">Portfolio Admin</div>
		<nav>
			{#each NAV_ITEMS as item (item.href)}
				{#if item.available}
					<a href={item.href} class:active={isActive(item.href)} onclick={closeSidebar}>
						<i class="fa-solid {item.icon}"></i>
						{item.label}
						{#if BADGE_COUNTS[item.href] && data[BADGE_COUNTS[item.href]] > 0}
							<span class="nav-badge">{data[BADGE_COUNTS[item.href]]}</span>
						{/if}
					</a>
				{:else}
					<span class="nav-disabled">
						<i class="fa-solid {item.icon}"></i>
						{item.label}
						<em>Segera</em>
					</span>
				{/if}
			{/each}
		</nav>
		<div class="admin-user">
			<span>{data.user.email}</span>
			<form method="POST" action="/admin/logout">
				<button type="submit">Keluar</button>
			</form>
		</div>
	</aside>
	<main class="admin-content">
		{@render children()}
	</main>
</div>

<style>
	/* Default browser body margin (8px) is enough to push the page a hair
	   taller than 100dvh, which was giving the outer document its own
	   scrollbar ON TOP OF .admin-content's — two scrollbars stacked at the
	   edge. Zeroing it out here (scoped to this layout, so it only applies
	   while an admin page is mounted) leaves exactly one. */
	:global(html),
	:global(body) {
		margin: 0;
		padding: 0;
		height: 100%;
		overflow: hidden;
	}

	.admin-shell {
		height: 100dvh;
		overflow: hidden;
		display: flex;
		background: #f4f4f6;
		font-family:
			'Inter',
			system-ui,
			sans-serif;
	}

	.admin-sidebar {
		width: 230px;
		flex-shrink: 0;
		overflow-y: auto;
		background: #17171c;
		color: #fff;
		display: flex;
		flex-direction: column;
		padding: 1.5rem 1rem;
	}

	.admin-brand {
		font-weight: 700;
		font-size: 1.05rem;
		margin-bottom: 1.5rem;
		padding: 0 0.7rem;
	}

	nav {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		flex: 1;
	}

	nav a,
	.nav-disabled {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		color: #c9c9d1;
		text-decoration: none;
		padding: 0.55rem 0.7rem;
		border-radius: 8px;
		font-size: 0.88rem;
	}

	nav a i,
	.nav-disabled i {
		width: 16px;
		text-align: center;
		font-size: 0.85rem;
		opacity: 0.8;
	}

	nav a:hover {
		background: #24242b;
		color: #fff;
	}

	nav a.active {
		background: #6c63ff;
		color: #fff;
	}

	.nav-disabled {
		color: #55555f;
		cursor: default;
	}

	.nav-badge {
		margin-left: auto;
		font-size: 0.7rem;
		font-weight: 700;
		background: #dc2626;
		color: #fff;
		padding: 0.1rem 0.45rem;
		border-radius: 999px;
	}

	.nav-disabled em {
		margin-left: auto;
		font-style: normal;
		font-size: 0.66rem;
		background: #24242b;
		color: #7a7a85;
		padding: 0.12rem 0.4rem;
		border-radius: 999px;
	}

	.admin-user {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding-top: 1rem;
		border-top: 1px solid #2a2a31;
		font-size: 0.78rem;
		color: #9a9aa2;
	}

	.admin-user span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.admin-user button {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #33333c;
		border-radius: 8px;
		background: transparent;
		color: #c9c9d1;
		cursor: pointer;
		font: inherit;
	}

	.admin-user button:hover {
		background: #24242b;
		color: #fff;
	}

	.admin-content {
		flex: 1;
		padding: 2rem 2.5rem;
		min-width: 0;
		height: 100%;
		overflow-y: auto;
	}

	/* --- mobile: sidebar becomes a slide-in panel behind a topbar --- */
	.admin-topbar {
		display: none;
	}

	.admin-backdrop {
		display: none;
	}

	.admin-brand-desktop {
		display: block;
	}

	@media (max-width: 860px) {
		:global(html),
		:global(body) {
			height: auto;
			overflow: visible;
		}

		.admin-shell {
			flex-direction: column;
			height: auto;
			overflow: visible;
		}

		.admin-content {
			height: auto;
			overflow-y: visible;
		}

		.admin-topbar {
			display: flex;
			align-items: center;
			gap: 0.75rem;
			padding: 0.9rem 1rem;
			background: #17171c;
			color: #fff;
			position: sticky;
			top: 0;
			z-index: 40;
		}

		.admin-topbar .admin-brand {
			margin: 0;
			padding: 0;
		}

		.admin-brand-desktop {
			display: none;
		}

		.admin-menu-toggle {
			width: 36px;
			height: 36px;
			flex-shrink: 0;
			border-radius: 8px;
			border: 1px solid #33333c;
			background: transparent;
			color: #fff;
			font-size: 0.95rem;
			cursor: pointer;
			transition:
				background 0.2s ease,
				transform 0.15s ease;
		}

		.admin-menu-toggle:active {
			transform: scale(0.94);
		}

		.admin-menu-toggle:hover {
			background: #24242b;
		}

		.admin-backdrop {
			display: block;
			position: fixed;
			inset: 0;
			border: none;
			background: rgba(0, 0, 0, 0.4);
			z-index: 45;
			padding: 0;
			cursor: default;
			animation: admin-backdrop-in 0.2s ease;
		}

		@keyframes admin-backdrop-in {
			from {
				opacity: 0;
			}
			to {
				opacity: 1;
			}
		}

		.admin-sidebar {
			position: fixed;
			inset: 0 25% 0 0;
			width: auto;
			max-width: 300px;
			z-index: 50;
			transform: translateX(-100%);
			transition: transform 0.32s cubic-bezier(0.32, 0.72, 0, 1);
			box-shadow: 4px 0 24px rgba(0, 0, 0, 0.25);
		}

		.admin-sidebar.open {
			transform: translateX(0);
		}

		.admin-content {
			padding: 1.25rem;
		}
	}
</style>
