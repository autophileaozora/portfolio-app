// One-off generator: bakes a procedural head+neck+shoulders bust into a flat
// binary array of [x,y,z, nx,ny,nz] * N particles. Run once at dev time
// (`node scripts/generate-particle-head.mjs`), never at runtime — the app
// just fetches the resulting static/assets/particle-head.bin as-is, so
// there's zero per-visitor cost for what would otherwise be a fairly heavy
// rejection-sampling loop.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(__dirname, '../static/assets/particle-head.bin');
const PARTICLE_COUNT = 16000;
const SHELL_THICKNESS = 0.018;
const MAX_ATTEMPTS = PARTICLE_COUNT * 4000;

function ellipsoidDist(x, y, z, cx, cy, cz, rx, ry, rz) {
	const dx = (x - cx) / rx;
	const dy = (y - cy) / ry;
	const dz = (z - cz) / rz;
	return Math.sqrt(dx * dx + dy * dy + dz * dz) - 1;
}

function smin(a, b, k) {
	const h = Math.max(k - Math.abs(a - b), 0) / k;
	return Math.min(a, b) - h * h * k * 0.25;
}

/** Stylized bust: skull + jaw blended into a face, then neck, then shoulders. */
function headSDF(x, y, z) {
	const skull = ellipsoidDist(x, y, z, 0, 0.15, 0, 0.52, 0.62, 0.58);
	const jaw = ellipsoidDist(x, y, z, 0, -0.15, 0.05, 0.4, 0.34, 0.42);
	const face = smin(skull, jaw, 0.25);

	const neck = ellipsoidDist(x, y, z, 0, -0.62, -0.02, 0.19, 0.26, 0.19);
	const headNeck = smin(face, neck, 0.18);

	const shoulders = ellipsoidDist(x, y, z, 0, -0.95, -0.05, 0.95, 0.22, 0.5);
	return smin(headNeck, shoulders, 0.22);
}

const EPS = 0.004;
function gradient(x, y, z) {
	const dx = headSDF(x + EPS, y, z) - headSDF(x - EPS, y, z);
	const dy = headSDF(x, y + EPS, z) - headSDF(x, y - EPS, z);
	const dz = headSDF(x, y, z + EPS) - headSDF(x, y, z - EPS);
	const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
	return [dx / len, dy / len, dz / len];
}

const BOUNDS = { xMin: -1.05, xMax: 1.05, yMin: -1.25, yMax: 0.9, zMin: -0.7, zMax: 0.7 };

function randRange(min, max) {
	return min + Math.random() * (max - min);
}

const positions = new Float32Array(PARTICLE_COUNT * 3);
const normals = new Float32Array(PARTICLE_COUNT * 3);

let accepted = 0;
let attempts = 0;
while (accepted < PARTICLE_COUNT && attempts < MAX_ATTEMPTS) {
	attempts++;
	const x = randRange(BOUNDS.xMin, BOUNDS.xMax);
	const y = randRange(BOUNDS.yMin, BOUNDS.yMax);
	const z = randRange(BOUNDS.zMin, BOUNDS.zMax);
	const d = headSDF(x, y, z);
	if (Math.abs(d) > SHELL_THICKNESS) continue;

	const [nx, ny, nz] = gradient(x, y, z);
	positions[accepted * 3] = x;
	positions[accepted * 3 + 1] = y;
	positions[accepted * 3 + 2] = z;
	normals[accepted * 3] = nx;
	normals[accepted * 3 + 1] = ny;
	normals[accepted * 3 + 2] = nz;
	accepted++;
}

if (accepted < PARTICLE_COUNT) {
	console.error(`Only accepted ${accepted}/${PARTICLE_COUNT} points after ${attempts} attempts — widen SHELL_THICKNESS.`);
	process.exit(1);
}

// Interleave into one buffer: [x,y,z,nx,ny,nz] * N, so the app needs only
// one fetch and one Float32Array view, no separate position/normal fetches.
const interleaved = new Float32Array(PARTICLE_COUNT * 6);
for (let i = 0; i < PARTICLE_COUNT; i++) {
	interleaved[i * 6] = positions[i * 3];
	interleaved[i * 6 + 1] = positions[i * 3 + 1];
	interleaved[i * 6 + 2] = positions[i * 3 + 2];
	interleaved[i * 6 + 3] = normals[i * 3];
	interleaved[i * 6 + 4] = normals[i * 3 + 1];
	interleaved[i * 6 + 5] = normals[i * 3 + 2];
}

writeFileSync(OUT_PATH, Buffer.from(interleaved.buffer));
console.log(`Wrote ${accepted} particles (${attempts} attempts) -> ${OUT_PATH} (${(interleaved.byteLength / 1024).toFixed(1)} KB)`);
