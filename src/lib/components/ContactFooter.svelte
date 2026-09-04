<script>
	import { onMount, onDestroy } from 'svelte';

	/**
	 * Ported 1:1 from the static site's components/contact-footer.js.
	 * The "Leave a Message" form is still client-side only for now (Phase B) —
	 * it becomes a real Supabase-backed form action in a later phase.
	 */
	const TESTIMONIALS = [
		{ quote: '"KEMARIN NGERJAIN PROYEK BARENG, SERU SIH, EL NYA BAIK RESPONNYA"', author: 'Abraham', role: 'Public User' },
		{
			quote: '"Instalasi jaringan lab komputer dan konfigurasi MikroTik cepat dan sangat terstruktur. Recommended IT Support!"',
			author: 'Budi Santoso',
			role: 'Lab Admin - UKSW'
		},
		{
			quote: '"Pengelolaan live streaming multi-camera sangat lancar tanpa kendala teknis. Terima kasih mas El!"',
			author: 'Jessica Natalia',
			role: 'Event Director'
		},
		{
			quote: '"Troubleshooting hardware & server cepat tanggap. Memiliki kemampuan komunikasi teknis yang luarbiasa."',
			author: 'Rian Prasetyo',
			role: 'Manager PT Selaras Citra Terabit'
		},
		{
			quote: '"KERJASAMA DENGAN MAS EL TERASA LANCAR, KOMUNIKASINYA JELAS, DAN HASILNYA BISA LANGSUNG DIPAKAI."',
			author: 'Dewi Anggraini',
			role: 'School Operations Lead'
		},
		{
			quote: '"SOLUSI IT YANG DIBERIKAN DETAIL, CEPAT, DAN MUDAH DIMENGERTI. SANGAT REKOMENDASI UNTUK TIM TEKNIS."',
			author: 'Fadli Rahman',
			role: 'Technical Coordinator'
		}
	];
	const TOTAL_COUNT = 20;
	const VISIBLE_DOTS = 3;

	let currentIndex = $state(0);
	let isFading = $state(false);
	let quote = $state(TESTIMONIALS[0].quote);
	let author = $state(TESTIMONIALS[0].author);
	let role = $state(TESTIMONIALS[0].role);

	function goToSlide(index) {
		currentIndex = index;
		isFading = true;
		setTimeout(() => {
			const t = TESTIMONIALS[currentIndex];
			quote = t.quote;
			author = t.author;
			role = t.role;
			isFading = false;
		}, 200);
	}

	let sliderInterval;
	onMount(() => {
		sliderInterval = setInterval(() => {
			goToSlide((currentIndex + 1) % TESTIMONIALS.length);
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

	const EMAIL = 'helloimanuel@yahoo.com';

	async function copyEmail() {
		try {
			await navigator.clipboard.writeText(EMAIL);
			showToast('Email copied to clipboard: ' + EMAIL);
		} catch {
			showToast('Email: ' + EMAIL);
		}
	}

	// --- Modals ---
	let msgModalOpen = $state(false);
	let readModalOpen = $state(false);

	function closeOnBackdrop(e, close) {
		if (e.target === e.currentTarget) close();
	}

	// --- Message form (client-side only for now) ---
	let senderName = $state('');
	let isAnonymous = $state(false);
	let messageContent = $state('');

	let answeredMessages = $state([
		{
			senderLabel: 'Abraham (Public User)',
			date: 'Yesterday',
			content: 'KEMARIN NGERJAIN PROYEK BARENG, SERU SIH, EL NYA BAIK RESPONNYA',
			reply: 'Terima kasih mas Abraham! Sukses selalu buat proyeknya.',
			pending: false
		}
	]);

	function submitMessage(e) {
		e.preventDefault();
		const content = messageContent.trim();
		if (!content) return;

		const name = isAnonymous || !senderName.trim() ? 'Anonymous Element' : senderName.trim();

		answeredMessages = [
			{ senderLabel: name, date: 'Just now', content, reply: null, pending: true },
			...answeredMessages
		];

		msgModalOpen = false;
		senderName = '';
		isAnonymous = false;
		messageContent = '';
		showToast('Message sent successfully! Thank you.');
	}
</script>

<!-- Testimonials & Leave a Message Section -->
<section id="contact" class="section engagement-section">
	<div class="engagement-grid">
		<div class="testimonial-card">
			<div class="testimonial-header">
				<span class="section-label testimonial-label">TESTIMONIAL</span>
				<span class="testimonial-counter">{currentIndex + 1}/{TOTAL_COUNT}</span>
			</div>
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
					{#each TESTIMONIALS.slice(0, VISIBLE_DOTS) as _, idx}
						<div class="dot" class:active={idx === currentIndex} onclick={() => goToSlide(idx)}></div>
					{/each}
				</div>
			</div>
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
			<span class="footer-label">Available for work &amp; Discussions</span>
			<div class="email-copy-wrapper">
				<a href={`mailto:${EMAIL}`} class="email-link">{EMAIL}</a>
				<button class="copy-btn" onclick={copyEmail}>COPY</button>
			</div>
		</div>
		<div class="footer-col align-right">
			<span class="footer-label">Let's Connected</span>
			<div class="social-links-inline">
				<a href="https://linkedin.com" target="_blank" rel="noreferrer" class="footer-social-link">LinkedIn</a>
				<a href="https://instagram.com" target="_blank" rel="noreferrer" class="footer-social-link">Instagram</a>
				<a href="https://whatsapp.com" target="_blank" rel="noreferrer" class="footer-social-link">Whatsapp</a>
			</div>
		</div>
	</div>
</footer>

<div class="footer-bottom">
	<p>&copy; 2026 Hello Imanuel. All Rights Reserved.</p>
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
		<form onsubmit={submitMessage}>
			<div class="form-group">
				<label class="form-label" for="sender-name">Your Name</label>
				<input type="text" id="sender-name" class="form-input" placeholder="e.g. Abraham" bind:value={senderName} />
			</div>
			<div class="form-group checkbox-group">
				<input type="checkbox" id="anonymous-check" bind:checked={isAnonymous} />
				<label class="form-label" for="anonymous-check">Send as Anonymous Element</label>
			</div>
			<div class="form-group">
				<label class="form-label" for="message-content">Your Message / Feedback</label>
				<textarea
					id="message-content"
					class="form-input"
					rows="4"
					placeholder="Write your message here..."
					required
					bind:value={messageContent}
				></textarea>
			</div>
			<button type="submit" class="btn-pill-accent btn-full">Submit Message &rarr;</button>
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
			{#each answeredMessages as item}
				<div class="answered-item">
					<div class="item-header">
						<strong>{item.senderLabel}</strong>
						<span class="item-date">{item.date}</span>
					</div>
					<p class="item-msg">"{item.content}"</p>
					<div class="item-reply">
						{#if item.pending}
							<i class="fa-solid fa-clock"></i> <em>Pending response from Andrian...</em>
						{:else}
							<i class="fa-solid fa-reply"></i> <strong>Andrian:</strong> <em>{item.reply}</em>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>

<div class="toast-notification" class:show={toastVisible}>
	<i class="fa-solid fa-circle-check"></i>
	<span>{toastMessage}</span>
</div>
