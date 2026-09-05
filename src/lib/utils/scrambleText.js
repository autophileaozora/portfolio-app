/**
 * Reveals `targetText` over `duration` ms, showing random glyphs in place of
 * characters not yet revealed — used for the Home summary carousel's
 * role/date text and the Projects hero's stat figures.
 */
export function scrambleText(setText, targetText, duration = 750) {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#$@%&*!?<>';
	const fps = 30;
	const totalFrames = Math.floor((duration / 1000) * fps);
	let frame = 0;

	const timer = setInterval(() => {
		frame++;
		const progress = frame / totalFrames;
		const revealedLength = Math.floor(progress * targetText.length);

		let output = '';
		for (let i = 0; i < targetText.length; i++) {
			if (i < revealedLength) output += targetText[i];
			else if (targetText[i] === ' ') output += ' ';
			else output += chars[Math.floor(Math.random() * chars.length)];
		}
		setText(output);

		if (frame >= totalFrames) {
			setText(targetText);
			clearInterval(timer);
		}
	}, 1000 / fps);

	return () => clearInterval(timer);
}
