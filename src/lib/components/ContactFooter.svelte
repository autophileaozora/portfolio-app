<script>
	import { onMount, onDestroy } from 'svelte';
	import { enhance } from '$app/forms';
	import { uploadViaSignedUrl } from '$lib/utils/uploadViaSignedUrl.js';

	/**
	 * profile/testimonials/answeredMessages/projects all come from Supabase
	 * (loaded once in the (public) layout, since this component renders on
	 * every public page). The message form posts to /messages regardless of
	 * which page it's opened from — an absolute action path works the same
	 * as a same-route one for use:enhance, so no need to duplicate this
	 * action across every public route's own +page.server.ts.
	 */
	let { profile = null, testimonials = [], answeredMessages = [], projects = [] } = $props();

	let visibleTestimonials = $derived(testimonials);
	const VISIBLE_DOTS = 3;

	let currentIndex = $state(0);
	let isFading = $state(false);
	let quote = $derived(visibleTestimonials[currentIndex]?.quote ?? '');
	let author = $derived(visibleTestimonials[currentIndex]?.author_name ?? '');
	let role = $derived(visibleTestimonials[currentIndex]?.author_role ?? '');

	function goToSlide(index) {
		isFading = true;
		setTimeout(() => {
			currentIndex = index;
			isFading = false;
		}, 200);
	}

	let sliderInterval;
	onMount(() => {
		sliderInterval = setInterval(() => {
			if (!visibleTestimonials.length) return;
			goToSlide((currentIndex + 1) % visibleTestimonials.length);
		}, 4000);
	});
	onDestroy(() => clearInterval(sliderInterval));

	// --- Copy email + toast ---
	let toastMessage = $state('');
	let toastVisible = $state(false);
	let toastTimer;

	function showToast(message) {
		toastMessage = message;
		toastVisible = true;
		clearTimeout(toastTimer);
		toastTimer = setTimeout(() => (toastVisible = false), 3200);
	}

	let email = $derived(profile?.email ?? '');
	let adminFirstName = $derived(profile?.full_name?.split(' ')[0] || 'Admin');
	let availabilityText = $derived(profile?.availability_text || 'Available for work & Discussions');
	let connectText = $derived(profile?.connect_text || "Let's Connected");
	let footerCopyright = $derived(profile?.footer_copyright || '© 2026 Hello Imanuel. All Rights Reserved.');

	async function copyEmail() {
		try {
			await navigator.clipboard.writeText(email);
			showToast('Email copied to clipboard: ' + email);
		} catch {
			showToast('Email: ' + email);
		}
	}

	// --- Modals ---
	let msgModalOpen = $state(false);
	let readModalOpen = $state(false);

	function closeOnBackdrop(e, close) {
		if (e.target === e.currentTarget) close();
	}

	// --- Message form (real /messages form action) ---
	let sending = $state(false);
	let sendError = $state('');
	let isAnonymous = $state(false);
	let avatarState = $state({ uploading: false, error: '', url: '' });
	let selectedProjectOption = $state('');
	let newProjectName = $state('');
	// "+ Project lain (belum ada di daftar)" is a magic option value, not a
	// real project id — everything below keys off whether that's selected.
	let isNewProjectMode = $derived(selectedProjectOption === '__new__');
	let submitProjectId = $derived(!isNewProjectMode && selectedProjectOption ? selectedProjectOption : '');

	$effect(() => {
		// Proposing a project that isn't in the list yet needs real
		// accountability — force anonymous off the moment that mode is
		// picked (mirrors the server-side rule in messageSchema's .refine()).
		if (isNewProjectMode) isAnonymous = false;
	});

	async function onAvatarChange(e) {
		const file = e.currentTarget.files?.[0];
		if (!file) return;
		avatarState = { uploading: true, error: '', url: '' };
		try {
			const url = await uploadViaSignedUrl(file, 'message-avatars', '/api/upload-message-avatar');
			avatarState = { uploading: false, error: '', url };
		} catch (err) {
			avatarState = { uploading: false, error: err instanceof Error ? err.message : 'Upload gagal.', url: '' };
		}
	}

	function resetMessageForm() {
		isAnonymous = false;
		avatarState = { uploading: false, error: '', url: '' };
		selectedProjectOption = '';
		newProjectName = '';
	}

	let visibleAnsweredMessages = $derived(
		answeredMessages.map((m) => ({
			senderLabel: m.is_anonymous ? 'Anonymous Element' : m.sender_name || 'Anonymous Element',
			date: formatDate(m.replied_at),
			content: m.content,
			reply: m.admin_reply
		}))
	);

	function formatDate(iso) {
		if (!iso) return '';
		return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
	}

	function handleMessageSubmit() {
		sending = true;
		sendError = '';
		return async ({ result, formElement }) => {
			sending = false;
			if (result.type === 'success') {
				formElement.reset();
				resetMessageForm();
				msgModalOpen = false;
				showToast('Message sent successfully! Thank you.');
				// A goal worth counting distinctly from a generic click — the
				// submit button being pressed doesn't confirm it actually
				// went through, this branch does. AnalyticsTracker.svelte
				// (mounted higher up in the public layout) listens for this.
				try {
					window.dispatchEvent(
						new CustomEvent('analytics:goal', { detail: { goal: 'message_sent', label: 'Pesan terkirim' } })
					);
				} catch {
					// Analytics must never break the actual feature.
				}
			} else if (result.type === 'failure') {
				sendError = result.data?.error ?? 'Gagal mengirim pesan.';
			} else {
				sendError = 'Terjadi kesalahan. Coba lagi.';
			}
		};
	}
</script>

<!-- Testimonials & Leave a Message Section -->
<section id="contact" class="section engagement-section">
	<div class="engagement-grid">
		<div class="testimonial-card">
			<div class="testimonial-header">
				<span class="section-label testimonial-label">TESTIMONIAL</span>
				{#if visibleTestimonials.length}
					<span class="testimonial-counter">{currentIndex + 1}/{visibleTestimonials.length}</span>
				{/if}
			</div>
			{#if visibleTestimonials.length}
				<blockquote class="quote-text" class:is-fading={isFading}>
					{quote}
				</blockquote>
				<div class="author-info">
					<div class="author-avatar"><i class="fa-solid fa-user-check"></i></div>
					<div>
						<h4 class="author-name" class:is-fading={isFading}>{author}</h4>
						<span class="author-role">{role}</span>
					</div>
				</div>
				<div class="slider-controls">
					<div class="slider-dots">
						{#each visibleTestimonials.slice(0, VISIBLE_DOTS) as _, idx}
							<div class="dot" class:active={idx === currentIndex} onclick={() => goToSlide(idx)}></div>
						{/each}
					</div>
				</div>
			{:else}
				<p class="no-answered">Belum ada testimonial.</p>
			{/if}
		</div>
		<div class="messages-card flat-card">
			<h2 class="card-title">LEAVE A MESSAGES</h2>
			<p class="messages-desc">
				Hi, I really appreciate if you would give me a review, or any messages. Don't worry, anonymous messages is
				possible by checking anonymous element.
			</p>
			<div class="messages-actions">
				<button class="btn-pill-dark" onclick={() => (msgModalOpen = true)}>Send Messages &rarr;</button>
				<button class="btn-pill-outline" onclick={() => (readModalOpen = true)}>Read Messages &rarr;</button>
			</div>
		</div>
	</div>
</section>

<!-- Footer -->
<footer class="footer">
	<div class="footer-top">
		<div class="footer-col">
			<span class="footer-label">{availabilityText}</span>
			{#if email}
				<div class="email-copy-wrapper">
					<a href={`mailto:${email}`} class="email-link">{email}</a>
					<button class="copy-btn" onclick={copyEmail}>COPY</button>
				</div>
			{/if}
		</div>
		<div class="footer-col align-right">
			<span class="footer-label">{connectText}</span>
			<div class="social-links-inline">
				<a href={profile?.social_linkedin || 'https://linkedin.com'} target="_blank" rel="noreferrer" class="footer-social-link">LinkedIn</a>
				<a href={profile?.social_instagram || 'https://instagram.com'} target="_blank" rel="noreferrer" class="footer-social-link">Instagram</a>
				<a href={profile?.social_whatsapp || 'https://whatsapp.com'} target="_blank" rel="noreferrer" class="footer-social-link">Whatsapp</a>
			</div>
		</div>
	</div>
</footer>

<div class="footer-bottom">
	<p>{footerCopyright}</p>
</div>

<!-- Message Modal -->
<div
	class="modal-backdrop"
	class:active={msgModalOpen}
	role="presentation"
	onclick={(e) => closeOnBackdrop(e, () => (msgModalOpen = false))}
>
	<div class="modal-content">
		<button class="modal-close" onclick={() => (msgModalOpen = false)}>&times;</button>
		<h3 class="modal-title">Leave a Review or Message</h3>
		<form method="POST" action="/messages" use:enhance={handleMessageSubmit}>
			{#if sendError}
				<p class="send-error">{sendError}</p>
			{/if}
			{#if !isAnonymous}
				<div class="form-group">
					<label class="form-label" for="sender-avatar">Your Photo (optional)</label>
					<input type="file" id="sender-avatar" accept="image/*" onchange={onAvatarChange} />
					{#if avatarState.uploading}
						<span class="upload-status">Uploading...</span>
					{:else if avatarState.error}
						<span class="field-error">{avatarState.error}</span>
					{:else if avatarState.url}
						<img src={avatarState.url} alt="Preview" class="avatar-preview" />
					{/if}
					<input type="hidden" name="sender_avatar_url" value={avatarState.url} />
				</div>
			{/if}
			<div class="form-group">
				<label class="form-label" for="sender-name">Your Name</label>
				<input type="text" id="sender-name" name="sender_name" class="form-input" placeholder="e.g. Abraham" />
			</div>
			{#if !isAnonymous}
				<div class="form-group">
					<label class="form-label" for="sender-instagram">Instagram (optional)</label>
					<input
						type="text"
						id="sender-instagram"
						name="sender_instagram"
						class="form-input"
						placeholder="@username"
					/>
				</div>
			{/if}
			<div class="form-group checkbox-group">
				<input
					type="checkbox"
					id="anonymous-check"
					name="is_anonymous"
					bind:checked={isAnonymous}
					disabled={isNewProjectMode}
				/>
				<label class="form-label" for="anonymous-check">Send as Anonymous Element</label>
			</div>
			<div class="form-group">
				<label class="form-label" for="project-select">Project we worked on together (optional)</label>
				<select id="project-select" class="form-input" bind:value={selectedProjectOption}>
					<option value="">— None / skip —</option>
					{#each projects as p (p.id)}
						<option value={p.id}>{p.title}</option>
					{/each}
					<option value="__new__">+ A project not listed here</option>
				</select>
				<input type="hidden" name="project_id" value={submitProjectId} />
				{#if isNewProjectMode}
					<input
						type="text"
						name="proposed_project_name"
						class="form-input"
						style="margin-top: 0.5rem;"
						placeholder="Project name"
						bind:value={newProjectName}
						required
					/>
					<span class="project-new-hint">Adding a new project can't be anonymous — your name is required.</span>
				{/if}
			</div>
			<div class="form-group">
				<label class="form-label" for="message-content">Your Message / Feedback</label>
				<textarea
					id="message-content"
					name="content"
					class="form-input"
					rows="4"
					placeholder="Write your message here..."
					required
				></textarea>
			</div>
			<button type="submit" class="btn-pill-accent btn-full" disabled={sending || avatarState.uploading}>
				{sending ? 'Sending...' : 'Submit Message'} &rarr;
			</button>
		</form>
	</div>
</div>

<!-- Read Modal -->
<div
	class="modal-backdrop"
	class:active={readModalOpen}
	role="presentation"
	onclick={(e) => closeOnBackdrop(e, () => (readModalOpen = false))}
>
	<div class="modal-content">
		<button class="modal-close" onclick={() => (readModalOpen = false)}>&times;</button>
		<h3 class="modal-title">Answered Messages &amp; Feedback</h3>
		<div class="answered-messages-list">
			{#each visibleAnsweredMessages as item}
				<div class="answered-item">
					<div class="item-header">
						<strong>{item.senderLabel}</strong>
						<span class="item-date">{item.date}</span>
					</div>
					<p class="item-msg">"{item.content}"</p>
					<div class="item-reply">
						<i class="fa-solid fa-reply"></i> <strong>{adminFirstName}:</strong> <em>{item.reply}</em>
					</div>
				</div>
			{:else}
				<p class="no-answered">Belum ada pesan yang dibalas.</p>
			{/each}
		</div>
	</div>
</div>

<div class="toast-notification" class:show={toastVisible}>
	<i class="fa-solid fa-circle-check"></i>
	<span>{toastMessage}</span>
</div>

<style>
	.send-error {
		margin: 0 0 0.75rem;
		padding: 0.6rem 0.75rem;
		border-radius: 8px;
		background: rgba(220, 38, 38, 0.1);
		border: 1px solid rgba(220, 38, 38, 0.3);
		color: #dc2626;
		font-size: 0.85rem;
	}

	.no-answered {
		color: inherit;
		opacity: 0.7;
		font-size: 0.9rem;
	}

	.upload-status {
		font-size: 0.8rem;
		color: var(--text-muted, #9a9aa2);
	}

	.field-error {
		font-size: 0.8rem;
		color: #f87171;
	}

	.avatar-preview {
		width: 56px;
		height: 56px;
		border-radius: 50%;
		object-fit: cover;
		border: 1px solid rgba(255, 255, 255, 0.15);
		display: block;
	}

	.project-new-hint {
		font-size: 0.78rem;
		color: var(--text-muted, #9a9aa2);
	}
</style>
