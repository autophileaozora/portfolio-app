<script>
	import { onMount, onDestroy } from 'svelte';
	import { enhance } from '$app/forms';
	import { uploadViaSignedUrl } from '$lib/utils/uploadViaSignedUrl.js';
	import { getDictionary } from '$lib/i18n';

	/**
	 * profile/testimonials/answeredMessages/projects all come from Supabase
	 * (loaded once in the (public) layout, since this component renders on
	 * every public page). The message form posts to /messages regardless of
	 * which page it's opened from — an absolute action path works the same
	 * as a same-route one for use:enhance, so no need to duplicate this
	 * action across every public route's own +page.server.ts.
	 */
	let { profile = null, testimonials = [], answeredMessages = [], projects = [], locale = 'id' } = $props();
	let t = $derived(getDictionary(locale));

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
			showToast(t.footer.emailCopiedToast(email));
		} catch {
			showToast(t.footer.emailFallbackToast(email));
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
			avatarState = { uploading: false, error: err instanceof Error ? err.message : t.messageModal.uploadFailed, url: '' };
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
			senderLabel: m.is_anonymous ? t.readModal.anonymousLabel : m.sender_name || t.readModal.anonymousLabel,
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
				showToast(t.messageModal.sentToast);
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
				sendError = result.data?.error ?? t.messageModal.failedGeneric;
			} else {
				sendError = t.messageModal.errorGeneric;
			}
		};
	}
</script>

<!-- Testimonials & Leave a Message Section -->
<section id="contact" class="section engagement-section">
	<div class="engagement-grid">
		<div class="testimonial-card">
			<div class="testimonial-header">
				<span class="section-label testimonial-label">{t.footer.testimonialLabel}</span>
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
				<p class="no-answered">{t.footer.noTestimonial}</p>
			{/if}
		</div>
		<div class="messages-card flat-card">
			<h2 class="card-title">{t.footer.leaveMessageTitle}</h2>
			<p class="messages-desc">
				{t.footer.leaveMessageDesc}
			</p>
			<div class="messages-actions">
				<button class="btn-pill-dark" onclick={() => (msgModalOpen = true)}>{t.footer.sendMessages} <span class="btn-arrow">&rarr;</span></button>
				<button class="btn-pill-outline" onclick={() => (readModalOpen = true)}>{t.footer.readMessages} <span class="btn-arrow">&rarr;</span></button>
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
					<button class="copy-btn" onclick={copyEmail}>{t.footer.copyBtn}</button>
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
		<h3 class="modal-title">{t.messageModal.title}</h3>
		<form method="POST" action="/messages" use:enhance={handleMessageSubmit}>
			{#if sendError}
				<p class="send-error">{sendError}</p>
			{/if}
			{#if !isAnonymous}
				<div class="form-group">
					<span class="form-label">{t.messageModal.photoLabel} <span class="optional-badge">{t.messageModal.optionalBadge}</span></span>
					<label for="sender-avatar" class="avatar-picker">
						<span class="avatar-picker-circle">
							{#if avatarState.url}
								<img src={avatarState.url} alt="" />
							{:else}
								<i class="fa-solid fa-user"></i>
							{/if}
						</span>
						<span class="avatar-picker-text">
							{#if avatarState.uploading}
								{t.messageModal.uploading}
							{:else if avatarState.error}
								{avatarState.error}
							{:else if avatarState.url}
								{t.messageModal.changePhoto}
							{:else}
								{t.messageModal.clickToUploadPhoto}
							{/if}
						</span>
					</label>
					<input
						type="file"
						id="sender-avatar"
						accept="image/*"
						onchange={onAvatarChange}
						class="avatar-picker-input"
					/>
					<input type="hidden" name="sender_avatar_url" value={avatarState.url} />
				</div>
			{/if}
			<div class="form-group">
				<label class="form-label" for="sender-name">{t.messageModal.yourName}</label>
				<input type="text" id="sender-name" name="sender_name" class="form-input" placeholder={t.messageModal.namePlaceholder} />
			</div>
			{#if !isAnonymous}
				<div class="form-group">
					<label class="form-label" for="sender-instagram">{t.messageModal.instagramOptional}</label>
					<input
						type="text"
						id="sender-instagram"
						name="sender_instagram"
						class="form-input"
						placeholder={t.messageModal.instagramPlaceholder}
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
				<label class="form-label" for="anonymous-check">{t.messageModal.sendAsAnonymous}</label>
			</div>
			<div class="form-group">
				<label class="form-label" for="project-select">{t.messageModal.projectTogether}</label>
				<select id="project-select" class="form-input" bind:value={selectedProjectOption}>
					<option value="">{t.messageModal.noneSkipOption}</option>
					{#each projects as p (p.id)}
						<option value={p.id}>{p.title}</option>
					{/each}
					<option value="__new__">{t.messageModal.newProjectOption}</option>
				</select>
				<input type="hidden" name="project_id" value={submitProjectId} />
				{#if isNewProjectMode}
					<input
						type="text"
						name="proposed_project_name"
						class="form-input"
						style="margin-top: 0.5rem;"
						placeholder={t.messageModal.projectNamePlaceholder}
						bind:value={newProjectName}
						required
					/>
					<span class="project-new-hint">{t.messageModal.newProjectHint}</span>
				{/if}
			</div>
			<div class="form-group">
				<label class="form-label" for="message-content">{t.messageModal.yourMessage}</label>
				<textarea
					id="message-content"
					name="content"
					class="form-input"
					rows="4"
					placeholder={t.messageModal.messagePlaceholder}
					required
				></textarea>
			</div>
			<button type="submit" class="btn-pill-accent btn-full" disabled={sending || avatarState.uploading}>
				{sending ? t.messageModal.sending : t.messageModal.submit} <span class="btn-arrow">&rarr;</span>
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
		<h3 class="modal-title">{t.readModal.title}</h3>
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
				<p class="no-answered">{t.readModal.noAnswered}</p>
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

	.optional-badge {
		font-size: 0.7em;
		font-weight: 400;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		opacity: 0.5;
		margin-left: 4px;
	}

	.avatar-picker {
		display: flex;
		align-items: center;
		gap: 12px;
		cursor: pointer;
	}

	.avatar-picker-circle {
		width: 56px;
		height: 56px;
		border-radius: 50%;
		border: 1.5px dashed rgba(255, 255, 255, 0.3);
		display: flex;
		align-items: center;
		justify-content: center;
		color: rgba(255, 255, 255, 0.5);
		font-size: 1.3rem;
		flex-shrink: 0;
		overflow: hidden;
		transition: border-color 0.2s ease;
	}

	.avatar-picker:hover .avatar-picker-circle {
		border-color: var(--accent-gold, #e2d175);
	}

	.avatar-picker-circle img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.avatar-picker-text {
		font-size: 0.85rem;
		color: var(--text-secondary, rgba(255, 255, 255, 0.7));
	}

	/* Visually hidden (not display:none, which would drop it from the
	   accessibility tree and break keyboard/label activation) — the
	   .avatar-picker label above is the actual clickable control. */
	.avatar-picker-input {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.project-new-hint {
		font-size: 0.78rem;
		color: var(--text-muted, #9a9aa2);
	}
</style>
