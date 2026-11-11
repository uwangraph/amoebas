import { error } from '@sveltejs/kit';
import { getEnv } from '$lib/server/guard';

/** Sajikan foto galeri dari R2 */
export async function GET(event) {
	const key = event.params.key;
	if (!key.startsWith('gallery/')) error(404, 'Not found');

	const { GALLERY } = getEnv(event);
	const object = await GALLERY.get(key, { onlyIf: event.request.headers });
	if (!object) error(404, 'Not found');

	const headers = new Headers();
	object.writeHttpMetadata(headers);
	headers.set('etag', object.httpEtag);
	headers.set('x-content-type-options', 'nosniff');
	if (!headers.has('cache-control'))
		headers.set('cache-control', 'public, max-age=31536000, immutable');

	// Kondisi If-None-Match terpenuhi -> tanpa body
	if (!('body' in object) || !object.body) {
		return new Response(null, { status: 304, headers });
	}
	return new Response(object.body, { headers });
}
