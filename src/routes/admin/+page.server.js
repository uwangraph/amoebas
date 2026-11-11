import { redirect } from '@sveltejs/kit';

/** Halaman ini hanya untuk admin yang sudah login */
export function load({ locals }) {
	if (!locals.admin) redirect(303, '/');
	return { admin: locals.admin };
}
