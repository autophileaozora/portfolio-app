<script>
	let { data } = $props();

	const CARDS = [
		{ href: '/admin/skills', label: 'Skills', icon: 'fa-code', countKey: 'skills' },
		{ href: '/admin/stats', label: 'Stats', icon: 'fa-chart-simple', countKey: 'stats' },
		{ href: '/admin/experience', label: 'Experience', icon: 'fa-briefcase', countKey: 'experience' },
		{ href: '/admin/testimonials', label: 'Testimonials', icon: 'fa-comment', countKey: 'testimonials' },
		{ href: '/admin/profile', label: 'Profile', icon: 'fa-user' },
		{ href: '/admin/projects', label: 'Projects', icon: 'fa-diagram-project', countKey: 'projects' },
		{ href: '/admin/messages', label: 'Messages', icon: 'fa-envelope', available: false }
	];
</script>

<svelte:head>
	<title>Admin Dashboard</title>
</svelte:head>

<div class="admin-page-header">
	<h1>Halo, {data.user.email}</h1>
</div>
<p class="dashboard-sub">Kelola konten portfolio dari sini.</p>

<div class="dashboard-grid">
	{#each CARDS as card (card.href)}
		{#if card.available === false}
			<div class="dashboard-card is-disabled">
				<i class="fa-solid {card.icon}"></i>
				<span class="card-label">{card.label}</span>
				<span class="card-sub">Segera hadir</span>
			</div>
		{:else}
			<a class="dashboard-card" href={card.href}>
				<i class="fa-solid {card.icon}"></i>
				<span class="card-label">{card.label}</span>
				<span class="card-sub">{card.countKey ? `${data.counts[card.countKey]} item` : 'Kelola profil'}</span>
			</a>
		{/if}
	{/each}
</div>

<style>
	.dashboard-sub {
		margin: -0.5rem 0 1.5rem;
		color: #7a7a85;
		font-size: 0.9rem;
	}

	.dashboard-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
		gap: 1rem;
	}

	.dashboard-card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		background: #fff;
		border: 1px solid #e4e4ea;
		border-radius: 12px;
		padding: 1.25rem;
		text-decoration: none;
		color: #1a1a1f;
		transition: border-color 0.15s ease;
	}

	.dashboard-card:hover {
		border-color: #6c63ff;
	}

	.dashboard-card i {
		font-size: 1.3rem;
		color: #6c63ff;
	}

	.card-label {
		font-weight: 600;
		font-size: 0.95rem;
	}

	.card-sub {
		font-size: 0.78rem;
		color: #9a9aa2;
	}

	.dashboard-card.is-disabled {
		color: #b3b3ba;
		cursor: default;
	}

	.dashboard-card.is-disabled i {
		color: #c7c7cf;
	}
</style>
