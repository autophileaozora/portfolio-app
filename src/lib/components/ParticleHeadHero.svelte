<script>
	import { onMount } from 'svelte';

	/**
	 * three is ~130KB gzipped — loaded via dynamic import() below (not a
	 * static import), so it's a separate lazy chunk fetched only once this
	 * component actually mounts client-side, not part of the /projects
	 * route's main bundle. Keeps first paint/TTI on that page unaffected.
	 * Procedural particle bust — not a real 3D scan/photo, a blended-ellipsoid
	 * signed-distance shape sampled into ~16k shell points at build time (see
	 * scripts/generate-particle-head.mjs) and shipped as a static binary, so
	 * there's no runtime cost for generating it, only for rendering it.
	 * Rotates to loosely follow the cursor, drifts on a slow idle spin, and
	 * "breathes" via a subtle scale oscillation. Rim color is a real
	 * view-dependent fresnel term (updates correctly as it turns), not a
	 * baked-in gradient.
	 */
	let container;
	let canvasReady = $state(false);

	const VERTEX_SHADER = `
		uniform float uPointSize;
		varying vec3 vNormal;

		void main() {
			vNormal = normalize(normalMatrix * normal);
			vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
			gl_PointSize = uPointSize * (300.0 / -mvPosition.z);
			gl_Position = projectionMatrix * mvPosition;
		}
	`;

	const FRAGMENT_SHADER = `
		precision mediump float;
		varying vec3 vNormal;
		uniform vec3 uKeyColor;
		uniform vec3 uRimColor;

		void main() {
			vec2 uv = gl_PointCoord - vec2(0.5);
			float dist = length(uv);
			if (dist > 0.5) discard;
			float alpha = smoothstep(0.5, 0.0, dist);

			float rim = pow(1.0 - clamp(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 2.2);
			vec3 color = mix(uKeyColor, uRimColor, rim);

			gl_FragColor = vec4(color, alpha * 0.85);
		}
	`;

	onMount(() => {
		let raf = null;
		let renderer, scene, camera, points, resizeObserver;
		let destroyed = false;

		const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		let targetYaw = 0;
		let targetPitch = 0;
		let currentYaw = 0;
		let currentPitch = 0;
		let autoAngle = 0;

		function onPointerMove(e) {
			const rect = container.getBoundingClientRect();
			const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
			const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
			targetYaw = Math.max(-1, Math.min(1, nx)) * 0.6;
			targetPitch = -Math.max(-1, Math.min(1, ny)) * 0.22;
		}

		async function init() {
			const THREE = await import('three');
			if (destroyed) return;

			try {
				renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
			} catch {
				return; // no WebGL — leave the decorative grid background only
			}

			scene = new THREE.Scene();
			camera = new THREE.PerspectiveCamera(35, 1, 0.1, 10);
			camera.position.set(0, -0.05, 3.3);
			camera.lookAt(0, -0.05, 0);

			renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
			container.appendChild(renderer.domElement);

			const res = await fetch('/assets/particle-head.bin');
			const buffer = await res.arrayBuffer();
			if (destroyed) return;

			const interleaved = new Float32Array(buffer);
			const count = interleaved.length / 6;
			const positions = new Float32Array(count * 3);
			const normals = new Float32Array(count * 3);
			for (let i = 0; i < count; i++) {
				positions[i * 3] = interleaved[i * 6];
				positions[i * 3 + 1] = interleaved[i * 6 + 1];
				positions[i * 3 + 2] = interleaved[i * 6 + 2];
				normals[i * 3] = interleaved[i * 6 + 3];
				normals[i * 3 + 1] = interleaved[i * 6 + 4];
				normals[i * 3 + 2] = interleaved[i * 6 + 5];
			}

			const geometry = new THREE.BufferGeometry();
			geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
			geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));

			const material = new THREE.ShaderMaterial({
				uniforms: {
					uPointSize: { value: 2.4 },
					uKeyColor: { value: new THREE.Color('#4a8bff') },
					uRimColor: { value: new THREE.Color('#ff3b3b') }
				},
				vertexShader: VERTEX_SHADER,
				fragmentShader: FRAGMENT_SHADER,
				transparent: true,
				depthWrite: false,
				blending: THREE.AdditiveBlending
			});

			points = new THREE.Points(geometry, material);
			scene.add(points);

			function resize() {
				if (!container) return;
				const { clientWidth: w, clientHeight: h } = container;
				if (!w || !h) return;
				renderer.setSize(w, h);
				camera.aspect = w / h;
				camera.updateProjectionMatrix();
			}

			resizeObserver = new ResizeObserver(resize);
			resizeObserver.observe(container);
			resize();

			canvasReady = true;

			if (reduceMotion) {
				renderer.render(scene, camera);
				return;
			}

			container.addEventListener('pointermove', onPointerMove);

			function animate(time) {
				raf = requestAnimationFrame(animate);
				autoAngle += 0.0015;
				currentYaw += (targetYaw - currentYaw) * 0.04;
				currentPitch += (targetPitch - currentPitch) * 0.04;
				points.rotation.y = autoAngle + currentYaw;
				points.rotation.x = currentPitch;

				const breathe = 1 + Math.sin(time * 0.0006) * 0.015;
				points.scale.setScalar(breathe);

				renderer.render(scene, camera);
			}
			raf = requestAnimationFrame(animate);
		}

		init();

		return () => {
			destroyed = true;
			if (raf) cancelAnimationFrame(raf);
			resizeObserver?.disconnect();
			container?.removeEventListener('pointermove', onPointerMove);
			points?.geometry.dispose();
			points?.material.dispose();
			renderer?.dispose();
			if (renderer?.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
		};
	});
</script>

<div class="particle-head-hero" bind:this={container} class:ready={canvasReady}></div>

<style>
	.particle-head-hero {
		position: absolute;
		inset: 0;
		opacity: 0;
		transition: opacity 1.2s ease;
	}

	.particle-head-hero.ready {
		opacity: 1;
	}

	.particle-head-hero :global(canvas) {
		display: block;
		width: 100%;
		height: 100%;
	}
</style>
