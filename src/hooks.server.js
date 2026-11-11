import { SESSION_COOKIE, verifySessionToken, parseAdminEmails } from '$lib/server/session';

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	const env = event.platform?.env;
	const email = await verifySessionToken(event.cookies.get(SESSION_COOKIE), env?.SESSION_SECRET);

	// Pastikan email masih terdaftar sebagai admin
	event.locals.admin =
		email && parseAdminEmails(env?.ADMIN_EMAILS).includes(email.toLowerCase()) ? email : null;

	return resolve(event);
}
