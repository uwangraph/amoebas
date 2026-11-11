import { json, error } from '@sveltejs/kit';
import { getEnv, requireAdmin } from '$lib/server/guard';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
// SVG sengaja tidak diizinkan (bisa berisi script)
const ALLOWED = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/gif': 'gif',
	'image/webp': 'webp',
	'image/avif': 'avif'
};

/** @param {{ id: number, key: string, title: string | null, description: string | null, created_at: string }} row */
const toImage = (row) => ({
	id: row.id,
	name: row.key.split('/').pop(),
	url: `/images/${row.key}`,
	title: row.title,
	description: row.description,
	created_at: row.created_at
});

/** Daftar foto (terbaru dulu) */
export async function GET(event) {
	const { DB } = getEnv(event);
	const { results } = await DB.prepare(
		'SELECT id, key, title, description, created_at FROM gallery ORDER BY created_at DESC, id DESC LIMIT 200'
	).all();
	return json({ images: results.map(toImage) });
}

/** Upload foto (admin) */
export async function POST(event) {
	const admin = requireAdmin(event);
	const { DB, GALLERY } = getEnv(event);

	const form = await event.request.formData();
	const file = form.get('file');
	if (!(file instanceof File)) error(400, 'Pilih file gambar terlebih dahulu');

	const ext = ALLOWED[/** @type {keyof typeof ALLOWED} */ (file.type)];
	if (!ext) error(400, 'Format harus JPG, PNG, GIF, WEBP, atau AVIF');
	if (file.size > MAX_SIZE) error(400, 'Ukuran file maksimal 5MB');

	const title =
		String(form.get('title') ?? '')
			.trim()
			.slice(0, 200) || null;
	const description =
		String(form.get('description') ?? '')
			.trim()
			.slice(0, 1000) || null;
	const key = `gallery/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

	await GALLERY.put(key, file.stream(), {
		httpMetadata: { contentType: file.type, cacheControl: 'public, max-age=31536000, immutable' }
	});

	try {
		const row = await DB.prepare(
			`INSERT INTO gallery (key, title, description, content_type, size, uploaded_by)
			 VALUES (?, ?, ?, ?, ?, ?)
			 RETURNING id, key, title, description, created_at`
		)
			.bind(key, title, description, file.type, file.size, admin)
			.first();
		return json({ image: toImage(/** @type {any} */ (row)) }, { status: 201 });
	} catch (err) {
		// Jangan tinggalkan file yatim di R2 jika insert gagal
		await GALLERY.delete(key);
		throw err;
	}
}

/** Hapus semua foto (admin) */
export async function DELETE(event) {
	requireAdmin(event);
	const { DB, GALLERY } = getEnv(event);

	const { results } = await DB.prepare('SELECT key FROM gallery').all();
	const keys = results.map((r) => /** @type {string} */ (r.key));

	// R2 delete menerima maksimal 1000 key per panggilan
	for (let i = 0; i < keys.length; i += 1000) {
		await GALLERY.delete(keys.slice(i, i + 1000));
	}
	await DB.prepare('DELETE FROM gallery').run();

	return json({ deleted: keys.length });
}
