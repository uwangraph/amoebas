// Loop subdivision untuk mesh segitiga berindeks.
// Bobot dihitung sekali dari topologi, lalu bisa diterapkan ke banyak set posisi
// (posisi dasar + setiap frame morph target) sehingga animasi tetap konsisten.

/**
 * Satukan verteks yang posisinya sama (sambungan UV) agar permukaan tidak retak.
 * @param {Float32Array} positions
 * @param {ArrayLike<number>} index
 */
export function weldByPosition(positions, index, precision = 1e-4) {
	const map = new Map();
	const remap = new Uint32Array(positions.length / 3);
	const keep = [];
	for (let i = 0; i < remap.length; i++) {
		const key = `${Math.round(positions[i * 3] / precision)},${Math.round(positions[i * 3 + 1] / precision)},${Math.round(positions[i * 3 + 2] / precision)}`;
		let id = map.get(key);
		if (id === undefined) {
			id = keep.length;
			map.set(key, id);
			keep.push(i);
		}
		remap[i] = id;
	}
	const newIndex = [];
	for (let f = 0; f < index.length; f += 3) {
		const a = remap[index[f]];
		const b = remap[index[f + 1]];
		const c = remap[index[f + 2]];
		if (a !== b && b !== c && c !== a) newIndex.push(a, b, c); // buang segitiga degenerate
	}
	return { keep, remap, index: Uint32Array.from(newIndex), count: keep.length };
}

/** Ambil subset verteks (hasil weld) dari array posisi. */
export function pick(positions, keep) {
	const out = new Float32Array(keep.length * 3);
	keep.forEach((src, i) => {
		out[i * 3] = positions[src * 3];
		out[i * 3 + 1] = positions[src * 3 + 1];
		out[i * 3 + 2] = positions[src * 3 + 2];
	});
	return out;
}

/**
 * Satu level Loop subdivision. Mengembalikan indeks baru dan fungsi `apply(positions)`.
 * @param {Uint32Array} index
 * @param {number} vertexCount
 */
function loopLevel(index, vertexCount) {
	const N = vertexCount;
	const edges = new Map(); // key -> { a, b, opp: number[], id }
	const edgeList = [];
	const edgeId = (a, b, opp) => {
		const key = a < b ? a * N + b : b * N + a;
		let e = edges.get(key);
		if (!e) {
			e = { a, b, opp: [], id: edgeList.length };
			edges.set(key, e);
			edgeList.push(e);
		}
		e.opp.push(opp);
		return e.id;
	};

	const faceEdges = new Uint32Array(index.length);
	for (let f = 0; f < index.length; f += 3) {
		const i0 = index[f];
		const i1 = index[f + 1];
		const i2 = index[f + 2];
		faceEdges[f] = edgeId(i0, i1, i2);
		faceEdges[f + 1] = edgeId(i1, i2, i0);
		faceEdges[f + 2] = edgeId(i2, i0, i1);
	}

	// Tetangga & tepi batas per verteks
	const neighbors = Array.from({ length: N }, () => new Set());
	const boundaryNeighbors = Array.from({ length: N }, () => []);
	for (const e of edgeList) {
		neighbors[e.a].add(e.b);
		neighbors[e.b].add(e.a);
		if (e.opp.length === 1) {
			boundaryNeighbors[e.a].push(e.b);
			boundaryNeighbors[e.b].push(e.a);
		}
	}

	// Bobot dalam format CSR: verteks lama dulu, lalu verteks tepi baru
	const outCount = N + edgeList.length;
	const offsets = new Uint32Array(outCount + 1);
	const src = [];
	const w = [];
	let o = 0;
	for (let v = 0; v < N; v++) {
		offsets[v] = o;
		const bn = boundaryNeighbors[v];
		if (bn.length >= 2) {
			src.push(v, bn[0], bn[1]);
			w.push(0.75, 0.125, 0.125);
			o += 3;
		} else {
			const nb = [...neighbors[v]];
			const n = nb.length;
			if (n === 0) {
				src.push(v);
				w.push(1);
				o += 1;
				continue;
			}
			const beta = n === 3 ? 3 / 16 : 3 / (8 * n);
			src.push(v);
			w.push(1 - n * beta);
			for (const u of nb) {
				src.push(u);
				w.push(beta);
			}
			o += 1 + n;
		}
	}
	for (const e of edgeList) {
		offsets[N + e.id] = o;
		if (e.opp.length >= 2) {
			src.push(e.a, e.b, e.opp[0], e.opp[1]);
			w.push(0.375, 0.375, 0.125, 0.125);
			o += 4;
		} else {
			src.push(e.a, e.b);
			w.push(0.5, 0.5);
			o += 2;
		}
	}
	offsets[outCount] = o;
	const srcArr = Uint32Array.from(src);
	const wArr = Float32Array.from(w);

	// Setiap segitiga menjadi 4
	const newIndex = new Uint32Array(index.length * 4);
	for (let f = 0, k = 0; f < index.length; f += 3) {
		const a = index[f];
		const b = index[f + 1];
		const c = index[f + 2];
		const ab = N + faceEdges[f];
		const bc = N + faceEdges[f + 1];
		const ca = N + faceEdges[f + 2];
		newIndex.set([a, ab, ca, ab, b, bc, ca, bc, c, ab, bc, ca], k);
		k += 12;
	}

	/** @param {Float32Array} positions */
	const apply = (positions) => {
		const out = new Float32Array(outCount * 3);
		for (let v = 0; v < outCount; v++) {
			let x = 0;
			let y = 0;
			let z = 0;
			for (let j = offsets[v]; j < offsets[v + 1]; j++) {
				const s = srcArr[j] * 3;
				const ww = wArr[j];
				x += positions[s] * ww;
				y += positions[s + 1] * ww;
				z += positions[s + 2] * ww;
			}
			out[v * 3] = x;
			out[v * 3 + 1] = y;
			out[v * 3 + 2] = z;
		}
		return out;
	};

	return { index: newIndex, count: outCount, apply };
}

/**
 * Subdivisi beberapa level sekaligus untuk sekumpulan set posisi (topologi sama).
 * @param {Uint32Array} index
 * @param {Float32Array[]} positionSets
 * @param {number} levels
 */
export function loopSubdivide(index, positionSets, levels = 2) {
	let idx = index;
	let count = positionSets[0].length / 3;
	let sets = positionSets;
	for (let l = 0; l < levels; l++) {
		const level = loopLevel(idx, count);
		sets = sets.map((p) => level.apply(p));
		idx = level.index;
		count = level.count;
	}
	return { index: idx, positionSets: sets, count };
}
