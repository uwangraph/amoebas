// Adegan 3D: pemanah berkuda (horseback archery) yang sedang berlari.
// Kuda: model "Horse" (Mirada / ROME, Apache-2.0) dengan animasi gallop, dihaluskan saat runtime.
// Penunggang: karakter "X Bot" (Mixamo) yang dipose lewat kode (duduk, memutar badan, menarik busur).
// Kredit lengkap: static/models/CREDITS.txt

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { weldByPosition, pick, loopSubdivide } from './subdivide.js';

const COLORS = {
	blue: 0x1f3bff,
	navy: 0x0a0f2e,
	yellow: 0xffd21f,
	white: 0xffffff
};

// Arah hadap dasar: kuda berlari ke kiri layar, sedikit menghadap kamera
const BASE_YAW = Math.PI - 0.45;
// Arah bidik default (dalam ruang kuda, 0 = depan kuda, positif = sisi kiri penunggang / kamera)
const ARCHER_YAW = 0.9;
const CYCLE = 2.8; // durasi satu siklus memanah (detik)
const MIN_SHOT_GAP = 0.35; // jeda minimal antar-tembakan manual (detik)
const GALLOP_SPEED = 1.25; // kecepatan animasi gallop (1 = asli, 1,5 detik per langkah)

const HORSE_WITHERS_HEIGHT = 1.6; // tinggi gumba kuda nyata (meter)
const HORSE_MODEL_WITHERS = 150; // tinggi gumba di koordinat model asli

const UP = new THREE.Vector3(0, 1, 0);
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _v3 = new THREE.Vector3();
const _q1 = new THREE.Quaternion();
const _q2 = new THREE.Quaternion();
const _q3 = new THREE.Quaternion();
const _m1 = new THREE.Matrix4();

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ reducedMotion?: boolean, onReady?: () => void, interactionTarget?: HTMLElement, modelBase?: string }} [opts]
 * @returns {() => void} fungsi untuk membersihkan adegan
 */
export function createHorseArcher(
	canvas,
	{ reducedMotion = false, onReady, interactionTarget, modelBase = '/models' } = {}
) {
	const renderer = new THREE.WebGLRenderer({
		canvas,
		antialias: true,
		alpha: true,
		powerPreference: 'high-performance'
	});
	renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
	renderer.outputColorSpace = THREE.SRGBColorSpace;
	renderer.toneMapping = THREE.NeutralToneMapping;
	renderer.toneMappingExposure = 0.95;
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFShadowMap;

	const scene = new THREE.Scene();
	const pmrem = new THREE.PMREMGenerator(renderer);
	const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
	scene.environment = envTexture;
	scene.environmentIntensity = 0.55;

	const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
	const lookTarget = new THREE.Vector3(0, 1.3, 0);

	// ---------- Cahaya ----------
	scene.add(new THREE.HemisphereLight(0xffffff, 0xdfe5ff, 0.45));

	const key = new THREE.DirectionalLight(0xffffff, 2.4);
	key.position.set(3, 8, 6);
	key.castShadow = true;
	key.shadow.mapSize.set(2048, 2048);
	key.shadow.camera.left = -4;
	key.shadow.camera.right = 4;
	key.shadow.camera.top = 4;
	key.shadow.camera.bottom = -4;
	key.shadow.bias = -0.0005;
	key.shadow.normalBias = 0.02;
	scene.add(key);

	const rim = new THREE.DirectionalLight(COLORS.yellow, 1.6);
	rim.position.set(-6, 4, -5);
	scene.add(rim);

	// ---------- Material ----------
	const mat = {
		horse: new THREE.MeshPhysicalMaterial({
			color: COLORS.blue,
			roughness: 0.32,
			clearcoat: 1,
			clearcoatRoughness: 0.22
		}),
		navy: new THREE.MeshPhysicalMaterial({ color: COLORS.navy, roughness: 0.45, clearcoat: 0.5 }),
		yellow: new THREE.MeshPhysicalMaterial({
			color: COLORS.yellow,
			roughness: 0.35,
			clearcoat: 0.8,
			clearcoatRoughness: 0.25,
			side: THREE.DoubleSide
		}),
		white: new THREE.MeshPhysicalMaterial({
			color: COLORS.white,
			roughness: 0.38,
			clearcoat: 0.7,
			clearcoatRoughness: 0.2
		}),
		speed: new THREE.MeshBasicMaterial({ color: COLORS.navy, transparent: true, opacity: 0.14 })
	};

	// ---------- Helper ----------
	const mesh = (geo, material, parent, pos = [0, 0, 0], rot = [0, 0, 0], scale) => {
		const m = new THREE.Mesh(geo, material);
		m.position.set(...pos);
		m.rotation.set(...rot);
		if (scale) m.scale.set(...scale);
		m.castShadow = true;
		m.receiveShadow = true;
		parent.add(m);
		return m;
	};
	const group = (parent, pos = [0, 0, 0], rot = [0, 0, 0]) => {
		const g = new THREE.Group();
		g.position.set(...pos);
		g.rotation.set(...rot);
		parent.add(g);
		return g;
	};
	// Silinder yang bisa ditempatkan di antara dua titik (tali busur)
	const segment = (radius, material, parent) =>
		mesh(new THREE.CylinderGeometry(radius, radius, 1, 10), material, parent);
	const placeSegment = (m, a, b) => {
		_a.subVectors(b, a);
		const len = Math.max(_a.length(), 1e-4);
		m.position.copy(a).addScaledVector(_a, 0.5);
		m.scale.set(1, len, 1);
		m.quaternion.setFromUnitVectors(UP, _a.normalize());
	};
	// IK dua ruas: posisi siku dari bahu (S) ke tangan (T) dengan arah tekuk (pole)
	const solveIK = (S, T, L1, L2, pole, outElbow) => {
		const d = _a.subVectors(T, S);
		const dist = Math.max(1e-3, Math.min(d.length(), L1 + L2 - 1e-3));
		d.normalize();
		const along = (L1 * L1 + dist * dist - L2 * L2) / (2 * dist);
		const h = Math.sqrt(Math.max(0, L1 * L1 - along * along));
		const perp = _b.copy(pole).addScaledVector(d, -pole.dot(d)).normalize();
		outElbow.copy(S).addScaledVector(d, along).addScaledVector(perp, h);
	};
	// Putar tulang dengan rotasi dalam ruang dunia
	const rotateBoneWorld = (bone, qWorld) => {
		bone.getWorldQuaternion(_q1);
		bone.parent.getWorldQuaternion(_q2);
		_q1.premultiply(qWorld);
		bone.quaternion.copy(_q2.invert().multiply(_q1));
		bone.updateMatrixWorld(true);
	};
	// Arahkan tulang agar ujungnya (child) menunjuk ke target (ruang dunia)
	const aimBone = (bone, child, target) => {
		bone.getWorldPosition(_v1);
		child.getWorldPosition(_v2);
		_v2.sub(_v1).normalize();
		_v3.copy(target).sub(_v1).normalize();
		_q3.setFromUnitVectors(_v2, _v3);
		rotateBoneWorld(bone, _q3);
	};

	// ---------- Lantai bayangan ----------
	const ground = new THREE.Mesh(
		new THREE.PlaneGeometry(40, 40),
		new THREE.ShadowMaterial({ opacity: 0.14 })
	);
	ground.rotation.x = -Math.PI / 2;
	ground.receiveShadow = true;
	scene.add(ground);

	const root = group(scene, [0.45, 0, 0], [0, BASE_YAW, 0]);

	// ---------- Garis kecepatan ----------
	const speedLines = [];
	for (let i = 0; i < 22; i++) {
		const m = new THREE.Mesh(new THREE.BoxGeometry(1, 0.012, 0.012), mat.speed);
		m.position.set(Math.random() * 12 - 6, 0.03 + Math.random() * 0.9, Math.random() * 5 - 2.5);
		m.scale.x = 0.4 + Math.random() * 1.1;
		m.userData.speed = 7 + Math.random() * 5;
		root.add(m);
		speedLines.push(m);
	}

	// ================= KUDA =================
	// Grup kuda: sumbu +x = arah depan kuda (model asli menghadap +z)
	const horseG = group(root, [0, 0, 0], [0, Math.PI / 2, 0]);
	const horseScale = HORSE_WITHERS_HEIGHT / HORSE_MODEL_WITHERS;
	horseG.scale.setScalar(horseScale);
	let horseMesh = null;
	let mixer = null;
	// Titik acuan di punggung kuda (indeks verteks) untuk menempatkan penunggang
	const anchors = { saddle: 0, front: 0, rear: 0 };

	/** Bangun kuda halus dari glTF: weld -> Loop subdivision 2x -> normal per frame */
	const buildHorse = (gltf) => {
		gltf.scene.updateMatrixWorld(true);
		let src = null;
		gltf.scene.traverse((o) => {
			if (o.isMesh && !src) src = o;
		});
		const g = src.geometry;
		const M = src.matrixWorld;
		const N3 = new THREE.Matrix3().setFromMatrix4(M);

		// Posisi dasar + posisi absolut tiap frame (dalam satuan model asli)
		const base = new Float32Array(g.attributes.position.count * 3);
		const v = new THREE.Vector3();
		for (let i = 0; i < g.attributes.position.count; i++) {
			v.fromBufferAttribute(g.attributes.position, i).applyMatrix4(M);
			v.toArray(base, i * 3);
		}
		const morphs = g.morphAttributes.position ?? [];
		const relative = g.morphTargetsRelative;
		const frames = morphs.map((attr) => {
			const out = new Float32Array(base.length);
			for (let i = 0; i < attr.count; i++) {
				v.fromBufferAttribute(attr, i);
				if (relative) {
					v.applyMatrix3(N3);
					out[i * 3] = base[i * 3] + v.x;
					out[i * 3 + 1] = base[i * 3 + 1] + v.y;
					out[i * 3 + 2] = base[i * 3 + 2] + v.z;
				} else {
					v.applyMatrix4(M).toArray(out, i * 3);
				}
			}
			return out;
		});

		const rawIndex = g.index
			? g.index.array
			: Uint32Array.from({ length: base.length / 3 }, (_, i) => i);
		const welded = weldByPosition(base, rawIndex, 0.05);
		const sets = [base, ...frames].map((p) => pick(p, welded.keep));
		const sub = loopSubdivide(welded.index, sets, 2);

		// Normal halus untuk posisi dasar dan setiap frame
		const normalsOf = (positions) => {
			const tmp = new THREE.BufferGeometry();
			tmp.setAttribute('position', new THREE.BufferAttribute(positions, 3));
			tmp.setIndex(new THREE.BufferAttribute(sub.index, 1));
			tmp.computeVertexNormals();
			const n = tmp.attributes.normal.array;
			tmp.dispose();
			return n;
		};
		const [basePos, ...framePos] = sub.positionSets;
		const baseNormal = normalsOf(basePos);

		const geo = new THREE.BufferGeometry();
		geo.setAttribute('position', new THREE.BufferAttribute(basePos, 3));
		geo.setAttribute('normal', new THREE.BufferAttribute(baseNormal, 3));
		geo.setIndex(new THREE.BufferAttribute(sub.index, 1));
		geo.morphTargetsRelative = true;
		geo.morphAttributes.position = framePos.map((p) => {
			const d = new Float32Array(p.length);
			for (let i = 0; i < p.length; i++) d[i] = p[i] - basePos[i];
			return new THREE.BufferAttribute(d, 3);
		});
		geo.morphAttributes.normal = framePos.map((p) => {
			const n = normalsOf(p);
			const d = new Float32Array(n.length);
			for (let i = 0; i < n.length; i++) d[i] = n[i] - baseNormal[i];
			return new THREE.BufferAttribute(d, 3);
		});
		geo.computeBoundingSphere();
		geo.boundingSphere.radius *= 1.3; // ruang untuk gerakan kaki

		horseMesh = new THREE.Mesh(geo, mat.horse);
		horseMesh.castShadow = true;
		horseMesh.receiveShadow = true;
		horseMesh.updateMorphTargets();
		horseG.add(horseMesh);
		horseG.updateMatrix();

		// Animasi gallop dari file, diarahkan ke mesh baru
		const clip = gltf.animations[0].clone();
		clip.tracks.forEach((t) => {
			t.name = '.morphTargetInfluences';
		});
		mixer = new THREE.AnimationMixer(horseMesh);
		mixer.clipAction(clip).play();
		mixer.timeScale = GALLOP_SPEED;

		// Cari verteks punggung: titik tertinggi di garis tengah pada posisi z tertentu
		const findTop = (z) => {
			let best = 0;
			let bestY = -Infinity;
			for (let i = 0; i < sub.count; i++) {
				const x = basePos[i * 3];
				const y = basePos[i * 3 + 1];
				const zz = basePos[i * 3 + 2];
				if (Math.abs(x - 2) < 10 && Math.abs(zz - z) < 12 && y > bestY) {
					bestY = y;
					best = i;
				}
			}
			return best;
		};
		anchors.saddle = findTop(-10);
		anchors.front = findTop(20);
		anchors.rear = findTop(-45);
	};

	// Posisi verteks setelah morph (ruang lokal horseG)
	const morphedVertex = (i, out) => {
		const geo = horseMesh.geometry;
		const p = geo.attributes.position;
		out.set(p.getX(i), p.getY(i), p.getZ(i));
		const inf = horseMesh.morphTargetInfluences;
		const ms = geo.morphAttributes.position;
		for (let k = 0; k < ms.length; k++) {
			const w = inf[k];
			if (w) {
				out.x += ms[k].getX(i) * w;
				out.y += ms[k].getY(i) * w;
				out.z += ms[k].getZ(i) * w;
			}
		}
		return out.applyMatrix4(horseG.matrix); // -> ruang root
	};

	// ================= PENUNGGANG =================
	const riderG = group(root);
	riderG.rotation.order = 'ZYX';
	const bones = {};
	const restPose = new Map();
	const hipsRest = new THREE.Vector3();
	const fingerPose = []; // { bone, q } - jari menggenggam busur / mengait tali
	const shoulderCenterRest = new THREE.Vector3();

	const buildRider = (gltf) => {
		const model = gltf.scene;
		model.traverse((o) => {
			if (o.isSkinnedMesh) {
				o.material = /joint/i.test(o.material.name) ? mat.navy : mat.white;
				o.castShadow = true;
				o.receiveShadow = true;
				o.frustumCulled = false;
			}
			if (o.isBone) {
				bones[o.name.replace('mixamorig', '')] = o;
				restPose.set(o, o.quaternion.clone());
			}
		});
		riderG.add(model);
		riderG.updateMatrixWorld(true);
		// Posisi tulang saat pose T (ruang riderG)
		riderG.worldToLocal(bones.Hips.getWorldPosition(hipsRest));
		riderG.worldToLocal(
			bones.LeftArm.getWorldPosition(_v1)
				.add(bones.RightArm.getWorldPosition(_v2))
				.multiplyScalar(0.5)
		);
		shoulderCenterRest.copy(_v1);

		// Jari menekuk ke arah telapak (pada pose T telapak menghadap ke bawah)
		const palm = new THREE.Vector3(0, -1, 0);
		const curl = {
			Index: [1.0, 1.15, 0.85],
			Middle: [1.05, 1.2, 0.85],
			Ring: [1.05, 1.2, 0.85],
			Pinky: [1.0, 1.15, 0.8],
			Thumb: [0.25, 0.45, 0.35]
		};
		for (const side of ['Left', 'Right']) {
			const amount = side === 'Left' ? 1 : 0.7; // kiri menggenggam busur, kanan mengait tali
			for (const [finger, angles] of Object.entries(curl)) {
				for (let j = 1; j <= 3; j++) {
					const b = bones[`${side}Hand${finger}${j}`];
					const c = bones[`${side}Hand${finger}${j + 1}`];
					if (!b || !c) continue;
					const dir = c.getWorldPosition(_v2).sub(b.getWorldPosition(_v1)).normalize();
					const axis = new THREE.Vector3().crossVectors(dir, palm).normalize();
					axis.applyQuaternion(b.getWorldQuaternion(_q1).invert()); // ke ruang lokal tulang
					const q = restPose
						.get(b)
						.clone()
						.multiply(new THREE.Quaternion().setFromAxisAngle(axis, angles[j - 1] * amount));
					fingerPose.push({ bone: b, q });
				}
			}
		}
	};

	// Ikat kepala + pita yang mengikuti kepala, tabung panah yang mengikuti punggung
	const headFollow = group(root);
	mesh(
		new THREE.TorusGeometry(0.1, 0.014, 8, 32),
		mat.yellow,
		headFollow,
		[0, 0.11, 0.0],
		[Math.PI / 2, 0, 0],
		[1, 1.12, 1]
	);
	const ribbons = [];
	for (const [y, x] of [
		[0.115, 0.03],
		[0.085, -0.03]
	]) {
		const geo = new THREE.PlaneGeometry(0.38, 0.032, 12, 1);
		geo.translate(-0.19, 0, 0);
		geo.rotateY(-Math.PI / 2); // memanjang ke belakang kepala (-z lokal kepala)
		const r = mesh(geo, mat.yellow, headFollow, [x, y, -0.1]);
		r.userData.base = Float32Array.from(geo.attributes.position.array);
		ribbons.push(r);
	}
	const backFollow = group(root);
	const quiver = group(backFollow, [0.06, 0.02, -0.16], [0.35, 0, -0.45]);
	mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.42, 16), mat.navy, quiver);
	for (let i = 0; i < 3; i++) {
		mesh(new THREE.ConeGeometry(0.025, 0.08, 6), mat.yellow, quiver, [
			(i - 1) * 0.025,
			0.25,
			(i % 2) * 0.015
		]);
	}
	const followBone = (follower, bone) => {
		bone.updateWorldMatrix(true, false);
		bone.matrixWorld.decompose(_v1, _q1, _v2);
		root.updateWorldMatrix(true, false);
		_m1.copy(root.matrixWorld).invert();
		follower.position.copy(_v1).applyMatrix4(_m1);
		root.getWorldQuaternion(_q2);
		follower.quaternion.copy(_q2.invert().multiply(_q1));
	};

	// ---------- Busur & panah (dalam bingkai bidikan, sumbu x = arah tembak) ----------
	const aim = group(riderG);
	aim.rotation.order = 'YXZ';

	const BOW_R = 0.62;
	const BOW_HALF = 0.78;
	const bowHand = new THREE.Vector3(0.68, 0.05, 0.02);
	const bow = group(aim, bowHand.toArray());
	mesh(
		new THREE.TorusGeometry(BOW_R, 0.016, 10, 64, BOW_HALF * 2),
		mat.yellow,
		bow,
		[-BOW_R, 0, 0],
		[0, 0, -BOW_HALF]
	);
	mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.1, 12), mat.navy, bow);
	const tipX = bowHand.x + BOW_R * Math.cos(BOW_HALF) - BOW_R;
	const tipTop = new THREE.Vector3(tipX, bowHand.y + BOW_R * Math.sin(BOW_HALF), bowHand.z);
	const tipBottom = new THREE.Vector3(tipX, bowHand.y - BOW_R * Math.sin(BOW_HALF), bowHand.z);
	const FULL_DRAW_X = 0.02; // tali ditarik sampai pipi
	const MAX_DRAW = tipX - FULL_DRAW_X;

	const stringTop = segment(0.004, mat.navy, aim);
	const stringBottom = segment(0.004, mat.navy, aim);

	const makeArrow = (parent) => {
		const g = group(parent);
		mesh(
			new THREE.CylinderGeometry(0.008, 0.008, 0.82, 8),
			mat.navy,
			g,
			[0.41, 0, 0],
			[0, 0, Math.PI / 2]
		);
		mesh(new THREE.ConeGeometry(0.022, 0.07, 10), mat.navy, g, [0.84, 0, 0], [0, 0, -Math.PI / 2]);
		for (const r of [0, Math.PI / 2]) {
			mesh(new THREE.BoxGeometry(0.12, 0.045, 0.003), mat.yellow, g, [0.07, 0, 0], [r, 0, 0]);
		}
		return g;
	};
	const nockedArrow = makeArrow(aim);
	// Panah yang dilepas hidup di ruang dunia, agar terbang lurus ke arah bidikan
	const flyingArrow = makeArrow(scene);
	flyingArrow.visible = false;
	let flight = null;

	const nock = new THREE.Vector3();
	const handRelax = new THREE.Vector3(-0.22, 0.08, 0.12);
	const handTarget = new THREE.Vector3();
	const elbow = new THREE.Vector3();
	const tmpTarget = new THREE.Vector3();
	const tmpPole = new THREE.Vector3();
	const bowPoleLocal = new THREE.Vector3(0, -1, -0.15).normalize();
	const drawPoleLocal = new THREE.Vector3(-1, 0.35, -0.2).normalize();

	const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
	const clamp01 = (x) => Math.min(1, Math.max(0, x));
	const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
	const nockAt = (draw, out) => out.set(tipX - draw * MAX_DRAW, bowHand.y, bowHand.z);

	// ---------- Bidikan interaktif ----------
	const raycaster = new THREE.Raycaster();
	const aimNdc = new THREE.Vector2();
	const aimPlane = new THREE.Plane();
	const aimHit = new THREE.Vector3();
	const aimLocal = new THREE.Vector3();
	const aimOrigin = new THREE.Vector3();
	const camDir = new THREE.Vector3();
	const aimState = {
		active: false, // true setelah pengguna menggerakkan kursor / mengetuk
		yaw: ARCHER_YAW,
		pitch: 0,
		targetYaw: ARCHER_YAW,
		targetPitch: 0
	};

	const updateAimTarget = () => {
		if (!aimState.active) return;
		raycaster.setFromCamera(aimNdc, camera);
		aim.getWorldPosition(aimOrigin);
		camera.getWorldDirection(camDir);
		// Bidang yang menghadap kamera dan melewati bahu pemanah
		aimPlane.setFromNormalAndCoplanarPoint(camDir, aimOrigin);
		if (!raycaster.ray.intersectPlane(aimPlane, aimHit)) return;
		// Ke ruang riderG relatif terhadap bahu (sumbu +z = depan kuda, +x = kiri penunggang)
		riderG.worldToLocal(aimLocal.copy(aimHit)).sub(aim.position);
		const horiz = Math.hypot(aimLocal.x, aimLocal.z);
		// 0 = depan kuda, +pi/2 = kiri, ~pi = ke belakang ("Parthian shot")
		if (horiz > 0.15) aimState.targetYaw = clamp(Math.atan2(aimLocal.x, aimLocal.z), -0.45, 2.9);
		aimState.targetPitch = clamp(Math.atan2(aimLocal.y, Math.max(horiz, 0.2)), -0.5, 0.7);
	};

	// Tembakan manual: lompat langsung ke momen pelepasan
	let shotOffset = 0;
	let fireRequested = false;
	let lastCycle = -1;

	// ---------- Pose per frame ----------
	const pose = (time, dt) => {
		if (!horseMesh || !bones.Hips) return;

		// --- Kuda ---
		mixer.update(dt);

		// --- Penunggang mengikuti punggung kuda ---
		const saddle = morphedVertex(anchors.saddle, new THREE.Vector3());
		const front = morphedVertex(anchors.front, new THREE.Vector3());
		const rear = morphedVertex(anchors.rear, new THREE.Vector3());
		const pitch = Math.atan2(front.y - rear.y, front.x - rear.x);
		riderG.position.set(saddle.x - 0.05, saddle.y + 0.02 - hipsRest.y, saddle.z);
		riderG.rotation.set(0, Math.PI / 2, pitch * 0.6);
		riderG.updateMatrixWorld(true);

		// --- Reset ke pose T lalu bentuk pose duduk ---
		for (const [bone, q] of restPose) bone.quaternion.copy(q);
		for (const f of fingerPose) f.bone.quaternion.copy(f.q);
		riderG.updateMatrixWorld(true);

		// Kaki mengapit badan kuda (target dalam ruang riderG -> dunia)
		for (const side of [1, -1]) {
			const s = side > 0 ? 'Left' : 'Right';
			const up = bones[`${s}UpLeg`];
			const leg = bones[`${s}Leg`];
			const foot = bones[`${s}Foot`];
			up.getWorldPosition(_v1);
			const hip = riderG.worldToLocal(_v1.clone());
			const knee = riderG.localToWorld(
				tmpTarget.set(hip.x + 0.2 * side, hip.y - 0.28, hip.z + 0.32)
			);
			aimBone(up, leg, knee);
			const ankle = riderG.localToWorld(
				new THREE.Vector3(hip.x + 0.24 * side, hip.y - 0.7, hip.z + 0.12)
			);
			aimBone(leg, foot, ankle);
		}

		// Arah tembak (ruang riderG) & putaran badan: lengan kiri (busur) menunjuk ke target
		updateAimTarget();
		const k = Math.min(1, dt * 9);
		aimState.yaw += (aimState.targetYaw - aimState.yaw) * k;
		aimState.pitch += (aimState.targetPitch - aimState.pitch) * k;
		const torsoYaw = aimState.yaw - Math.PI / 2; // pose T: lengan kiri ke +x
		riderG.getWorldQuaternion(_q3);
		const upWorld = _v3.set(0, 1, 0).applyQuaternion(_q3);
		const twist = new THREE.Quaternion();
		for (const [name, part] of [
			['Spine', 0.3],
			['Spine1', 0.3],
			['Spine2', 0.4]
		]) {
			twist.setFromAxisAngle(upWorld, torsoYaw * part);
			rotateBoneWorld(bones[name], twist);
		}
		// Kepala menoleh ke arah target (90° dari dada) dan sedikit mengikuti pitch
		twist.setFromAxisAngle(upWorld, (Math.PI / 2) * 0.35);
		rotateBoneWorld(bones.Neck, twist);
		twist.setFromAxisAngle(upWorld, (Math.PI / 2) * 0.55);
		rotateBoneWorld(bones.Head, twist);

		// Bingkai bidikan di tengah bahu
		aim.position.copy(shoulderCenterRest);
		aim.rotation.set(0, torsoYaw, aimState.pitch);
		aim.updateMatrixWorld(true);

		// Sedikit meredam guncangan
		archerSway(time);

		// --- Siklus memanah (klik/ketuk mempercepat ke momen pelepasan) ---
		if (fireRequested) {
			const c0 = (time + shotOffset) % CYCLE;
			if (c0 < 1.75) {
				shotOffset += 1.75 - c0;
				fireRequested = false;
			} else if (c0 - 1.75 > MIN_SHOT_GAP) {
				shotOffset += CYCLE - c0;
			}
		}
		const at = time + shotOffset;
		const c = at % CYCLE;
		const cycleIndex = Math.floor(at / CYCLE);
		let stringDraw = 0;
		nockedArrow.visible = c > 0.2 && c < 1.75;

		if (c < 0.45) {
			nockAt(0, nock);
			handTarget.lerpVectors(handRelax, nock, ease(c / 0.45));
		} else if (c < 1.35) {
			stringDraw = ease((c - 0.45) / 0.9);
			nockAt(stringDraw, handTarget);
		} else if (c < 1.75) {
			stringDraw = 1 + Math.sin(at * 40) * 0.004;
			nockAt(1, handTarget);
		} else {
			const r = c - 1.75;
			stringDraw = -0.06 * Math.exp(-r * 18) * Math.sin(r * 70);
			nockAt(1, nock);
			handTarget.lerpVectors(nock, handRelax, ease(clamp01(r / 0.3)));
			if (cycleIndex !== lastCycle && !reducedMotion) {
				lastCycle = cycleIndex;
				flyingArrow.position.copy(aim.localToWorld(nockAt(1, nock)));
				aim.getWorldQuaternion(flyingArrow.quaternion);
				flight = { life: 0 };
			}
		}

		nockAt(Math.max(stringDraw, -0.1), nock);
		placeSegment(stringTop, tipTop, nock);
		placeSegment(stringBottom, nock, tipBottom);
		nockedArrow.position.copy(nock);

		// --- Lengan (IK ke busur & tali) ---
		const armTo = (side, targetLocal, poleLocal) => {
			const upper = bones[`${side}Arm`];
			const fore = bones[`${side}ForeArm`];
			const hand = bones[`${side}Hand`];
			upper.getWorldPosition(_v1);
			const S = _v1.clone();
			fore.getWorldPosition(_v2);
			const L1 = S.distanceTo(_v2);
			hand.getWorldPosition(_v3);
			const L2 = _v2.distanceTo(_v3);
			const T = aim.localToWorld(tmpTarget.copy(targetLocal));
			tmpPole.copy(poleLocal).transformDirection(aim.matrixWorld);
			solveIK(S, T, L1, L2, tmpPole, elbow);
			aimBone(upper, fore, elbow);
			aimBone(fore, hand, T);
		};
		armTo('Left', bowHand, bowPoleLocal);
		armTo('Right', handTarget, drawPoleLocal);

		// Aksesori mengikuti tulang
		followBone(headFollow, bones.Head);
		followBone(backFollow, bones.Spine2);
		for (const r of ribbons) {
			const pos = r.geometry.attributes.position;
			const base = r.userData.base;
			for (let i = 0; i < pos.count; i++) {
				const z = base[i * 3 + 2];
				const kk = -z / 0.38;
				pos.setY(i, base[i * 3 + 1] + Math.sin(time * 14 + z * 12) * 0.03 * kk);
				pos.setX(i, base[i * 3] + Math.cos(time * 11 + z * 9) * 0.045 * kk);
			}
			pos.needsUpdate = true;
		}

		// --- Panah yang melesat ---
		if (flight) {
			flight.life += dt;
			flyingArrow.translateX((9 + flight.life * 8) * dt);
			flyingArrow.position.y -= flight.life * 0.3 * dt;
			flyingArrow.visible = flight.life < 0.9;
			if (flight.life >= 0.9) flight = null;
		}

		// --- Garis kecepatan ---
		for (const l of speedLines) {
			l.position.x -= l.userData.speed * dt;
			if (l.position.x < -6) l.position.x = 6 + Math.random() * 2;
		}
	};

	// Goyangan kecil tubuh atas mengikuti langkah kuda
	const archerSway = (time) => {
		const t = time * GALLOP_SPEED * ((Math.PI * 2) / 1.5);
		_q1.setFromAxisAngle(
			_v1.set(1, 0, 0).applyQuaternion(riderG.getWorldQuaternion(_q2)),
			Math.sin(t) * 0.025
		);
		rotateBoneWorld(bones.Spine, _q1);
	};

	// ---------- Kamera & ukuran ----------
	const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
	let baseDist = 10;
	const resize = () => {
		const w = canvas.clientWidth;
		const h = canvas.clientHeight;
		if (!w || !h) return;
		renderer.setSize(w, h, false);
		camera.aspect = w / h;
		// Di layar lebar kanvas menutupi seluruh hero (agar panah bisa terbang melintasi layar),
		// tetapi model dibingkai seolah berada di panel kanan selebar 62%.
		const panel = camera.aspect > 1.1 ? 0.62 : 1;
		const vFov = (camera.fov * Math.PI) / 180;
		const tanH = Math.tan(vFov / 2) * camera.aspect;
		const distH = 3.4 / 2 / Math.tan(vFov / 2);
		const distW = 4.6 / 2 / (tanH * panel);
		baseDist = Math.max(distH, distW);
		const panelCenterNdc = 1 - panel;
		root.position.x = 0.3 + panelCenterNdc * baseDist * tanH;
		camera.updateProjectionMatrix();
	};
	const updateCamera = () => {
		pointer.x += (pointer.tx - pointer.x) * 0.05;
		pointer.y += (pointer.ty - pointer.y) * 0.05;
		root.rotation.y = BASE_YAW + pointer.x * 0.1;
		camera.position.set(pointer.x * 0.3, 2.2 + pointer.y * 0.3, baseDist);
		camera.lookAt(lookTarget);
	};

	const setAimFromEvent = (e) => {
		const rect = canvas.getBoundingClientRect();
		if (!rect.width || !rect.height) return;
		aimNdc.set(
			((e.clientX - rect.left) / rect.width) * 2 - 1,
			-((e.clientY - rect.top) / rect.height) * 2 + 1
		);
		aimState.active = true;
	};
	const onPointer = (e) => {
		pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
		pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
		setAimFromEvent(e);
	};
	const onFire = (e) => {
		// Jangan menembak saat menekan tombol / tautan di hero
		if (e.target instanceof Element && e.target.closest('a, button, input, textarea, label'))
			return;
		setAimFromEvent(e);
		fireRequested = true;
	};

	// ---------- Loop ----------
	const timer = new THREE.Timer();
	let elapsed = 0;
	let raf = 0;
	let inView = true;
	let ready = false;
	let disposed = false;

	const renderFrame = () => {
		renderer.render(scene, camera);
		if (!ready) {
			ready = true;
			onReady?.();
		}
	};

	const loop = (now) => {
		raf = requestAnimationFrame(loop);
		timer.update(now);
		const dt = Math.min(timer.getDelta(), 1 / 20);
		if (!inView || document.hidden) return;
		elapsed += dt;
		pose(elapsed, dt);
		updateCamera();
		renderFrame();
	};

	resize();
	const ro = new ResizeObserver(() => {
		resize();
		if (reducedMotion && horseMesh) {
			updateCamera();
			renderFrame();
		}
	});
	ro.observe(canvas);
	const io = new IntersectionObserver(([entry]) => (inView = entry.isIntersecting));
	io.observe(canvas);

	const clickTarget = interactionTarget ?? canvas;
	if (!reducedMotion) {
		window.addEventListener('pointermove', onPointer);
		clickTarget.addEventListener('click', onFire);
	}

	// ---------- Muat model ----------
	const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
	Promise.all([
		loader.loadAsync(`${modelBase}/horse.glb`),
		loader.loadAsync(`${modelBase}/rider.glb`)
	])
		.then(([horseGltf, riderGltf]) => {
			if (disposed) return;
			buildHorse(horseGltf);
			buildRider(riderGltf);
			if (reducedMotion) {
				// Satu pose diam: busur ditarik penuh
				pose(1.5, 0.5);
				updateCamera();
				renderFrame();
			} else {
				raf = requestAnimationFrame(loop);
			}
		})
		.catch((err) => console.warn('Model 3D gagal dimuat:', err));

	return () => {
		disposed = true;
		cancelAnimationFrame(raf);
		ro.disconnect();
		io.disconnect();
		window.removeEventListener('pointermove', onPointer);
		clickTarget.removeEventListener('click', onFire);
		mixer?.stopAllAction();
		scene.traverse((o) => {
			if (o.geometry) o.geometry.dispose();
		});
		Object.values(mat).forEach((m) => m.dispose());
		ground.material.dispose();
		timer.dispose();
		envTexture.dispose();
		pmrem.dispose();
		renderer.dispose();
	};
}
