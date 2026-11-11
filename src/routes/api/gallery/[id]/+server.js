import { json, error } from '@sveltejs/kit';
import { getEnv, requireAdmin } from '$lib/server/guard';

/** Hapus satu foto (admin) */
export async function DELETE(event) {
	requireAdmin(event);
	const { DB, GALLERY } = getEnv(event);

	const id = Number(event.params.id);
	if (!Number.isInteger(id)) error(400, 'ID tidak valid');

	const row = await DB.prepare('DELETE FROM gallery WHERE id = ? RETURNING key').bind(id).first();
	if (!row) error(404, 'Foto tidak ditemukan');

	await GALLERY.delete(/** @type {string} */ (row.key));
	return json({ deleted: id });
}
