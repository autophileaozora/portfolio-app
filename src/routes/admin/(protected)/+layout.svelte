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
</script>

<svelte:head>
	<title>Admin</title>
</svelte:head>

<div class="admin-shell">
	<aside class="admin-sidebar">
		<div class="admin-brand">Portfolio Admin</div>
		<nav>
			{#each NAV_ITEMS as item (item.href)}
				{#if item.available}
					<a href={item.href} class:active={isActive(item.href)}>
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
	.admin-shell {
		min-height: 100dvh;
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
	}
</style>
