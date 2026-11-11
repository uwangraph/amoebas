import { error } from '@sveltejs/kit';

/**
 * Ambil binding Cloudflare dan pastikan tersedia.
 * @param {import('@sveltejs/kit').RequestEvent} event
 */
export function getEnv(event) {
	const env = event.platform?.env;
	if (!env?.DB || !env?.GALLERY) error(500, 'Binding Cloudflare (DB / GALLERY) tidak tersedia');
	return env;
}

/** @param {import('@sveltejs/kit').RequestEvent} event */
export function requireAdmin(event) {
	if (!event.locals.admin) error(401, 'Hanya admin yang boleh melakukan ini');
	return event.locals.admin;
}
