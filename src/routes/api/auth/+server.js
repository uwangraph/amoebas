import { json, error } from '@sveltejs/kit';
import {
	SESSION_COOKIE,
	SESSION_MAX_AGE,
	createSessionToken,
	safeEqual,
	parseAdminEmails
} from '$lib/server/session';

/** Status sesi saat ini */
export function GET({ locals }) {
	return json({ admin: locals.admin });
}

/** Login admin */
export async function POST({ request, cookies, platform, url }) {
	const env = platform?.env;
	if (!env?.ADMIN_PASSWORD || !env?.SESSION_SECRET) {
		error(500, 'Login admin belum dikonfigurasi (ADMIN_PASSWORD / SESSION_SECRET)');
	}

	const body = await request.json().catch(() => ({}));
	const email = String(body.email ?? '')
		.trim()
		.toLowerCase();
	const password = String(body.password ?? '');

	const isAdminEmail = parseAdminEmails(env.ADMIN_EMAILS).includes(email);
	const passwordOk = await safeEqual(password, env.ADMIN_PASSWORD, env.SESSION_SECRET);

	if (!isAdminEmail || !passwordOk) {
		error(401, 'Email atau password salah');
	}

	cookies.set(SESSION_COOKIE, await createSessionToken(email, env.SESSION_SECRET), {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: url.protocol === 'https:',
		maxAge: SESSION_MAX_AGE
	});

	return json({ admin: email });
}

/** Logout */
export function DELETE({ cookies }) {
	cookies.delete(SESSION_COOKIE, { path: '/' });
	return json({ admin: null });
}
