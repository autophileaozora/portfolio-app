<script>
	import '$lib/styles/admin.css';

	let { data, children } = $props();

	const NAV_ITEMS = [
		{ href: '/admin', label: 'Dashboard' },
		{ href: '/admin/projects', label: 'Projects' },
		{ href: '/admin/experience', label: 'Experience' },
		{ href: '/admin/skills', label: 'Skills' },
		{ href: '/admin/testimonials', label: 'Testimonials' },
		{ href: '/admin/stats', label: 'Stats' },
		{ href: '/admin/profile', label: 'Profile' },
		{ href: '/admin/messages', label: 'Messages' }
	];
</script>

<svelte:head>
	<title>Admin</title>
</svelte:head>

<div class="admin-shell">
	<aside class="admin-sidebar">
		<div class="admin-brand">Admin</div>
		<nav>
			{#each NAV_ITEMS as item (item.href)}
				<a href={item.href}>{item.label}</a>
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
		width: 220px;
		flex-shrink: 0;
		background: #17171c;
		color: #fff;
		display: flex;
		flex-direction: column;
		padding: 1.5rem 1rem;
	}

	.admin-brand {
		font-weight: 700;
		font-size: 1.1rem;
		margin-bottom: 1.5rem;
	}

	nav {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		flex: 1;
	}

	nav a {
		color: #c9c9d1;
		text-decoration: none;
		padding: 0.55rem 0.7rem;
		border-radius: 8px;
		font-size: 0.9rem;
	}

	nav a:hover {
		background: #24242b;
		color: #fff;
	}

	.admin-user {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding-top: 1rem;
		border-top: 1px solid #2a2a31;
		font-size: 0.8rem;
		color: #9a9aa2;
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
		padding: 2rem;
		min-width: 0;
	}
</style>
