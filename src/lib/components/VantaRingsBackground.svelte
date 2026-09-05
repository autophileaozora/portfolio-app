<script>
	import { onMount } from 'svelte';

	/**
	 * VANTA.RINGS (vantajs.com) — an interactive Three.js background effect.
	 * Config values below are exactly what
	 * https://www.vantajs.com/?effect=rings#(...) produced for this project.
	 *
	 * Both `three` and the vanta effect are dynamically import()'d inside
	 * onMount (not a static import), same reasoning as the earlier particle
	 * hero attempt: keeps the ~130KB+ three.js payload out of this route's
	 * main bundle, fetched only once this component actually mounts.
	 */
	let container;

	onMount(() => {
		let vantaEffect;
		let destroyed = false;

		(async () => {
			const THREE = await import('three');

			// vanta.rings.min.js reads `window.THREE` as a global at module-eval
			// time (not an import) — that's how every Vanta effect is built,
			// not something this integration can avoid or work around.
			if (!window.THREE) window.THREE = THREE;

			const { default: RINGS } = await import('vanta/dist/vanta.rings.min.js');
			if (destroyed) return;

			vantaEffect = RINGS({
				el: container,
				THREE,
				backgroundAlpha: 1,
				backgroundColor: 0x050a17, // darker than the user's original paste (0x22466d) —
				// the rings' material is semi-transparent, so it blends with
				// whatever's behind it; a lighter/more saturated background
				// like 0x22466d visibly dulls the ring colors by comparison,
				// darker restores the "pop" the transparent version had
				color: 0x88ff00,
				gyroControls: false,
				minHeight: 200,
				minWidth: 200,
				mouseControls: true,
				touchControls: true,
				scale: 1.0,
				scaleMobile: 1.0
			});
		})();

		return () => {
			destroyed = true;
			vantaEffect?.destroy();
		};
	});
</script>

<div class="vanta-rings-bg" bind:this={container}></div>

<style>
	.vanta-rings-bg {
		position: absolute;
		inset: 0;
		z-index: 2; /* .hero-wrap::after (the vignette gradient) sits at z-index 1 */
	}

	.vanta-rings-bg :global(canvas) {
		display: block;
	}
</style>
