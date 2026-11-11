// Sesi admin berbasis cookie yang ditandatangani HMAC-SHA256 (Web Crypto, jalan di Workers).

export const SESSION_COOKIE = 'amoebas_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 hari

const encoder = new TextEncoder();

/** @param {Uint8Array} bytes */
function toBase64Url(bytes) {
	let bin = '';
	for (const b of bytes) bin += String.fromCharCode(b);
	return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** @param {string} str */
function fromBase64Url(str) {
	const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (str.length % 4)) % 4);
	const bin = atob(b64);
	return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

/** @param {string} secret */
function importKey(secret) {
	return crypto.subtle.importKey(
		'raw',
		encoder.encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign', 'verify']
	);
}

/**
 * @param {string} email
 * @param {string} secret
 */
export async function createSessionToken(email, secret) {
	const payload = toBase64Url(
		encoder.encode(JSON.stringify({ email, exp: Date.now() + SESSION_MAX_AGE * 1000 }))
	);
	const sig = await crypto.subtle.sign('HMAC', await importKey(secret), encoder.encode(payload));
	return `${payload}.${toBase64Url(new Uint8Array(sig))}`;
}

/**
 * Mengembalikan email admin jika token valid, selain itu null.
 * @param {string | undefined} token
 * @param {string} secret
 */
export async function verifySessionToken(token, secret) {
	if (!token || !secret) return null;
	const [payload, sig] = token.split('.');
	if (!payload || !sig) return null;
	try {
		const ok = await crypto.subtle.verify(
			'HMAC',
			await importKey(secret),
			fromBase64Url(sig),
			encoder.encode(payload)
		);
		if (!ok) return null;
		const data = JSON.parse(new TextDecoder().decode(fromBase64Url(payload)));
		if (typeof data.email !== 'string' || typeof data.exp !== 'number' || data.exp < Date.now()) {
			return null;
		}
		return data.email;
	} catch {
		return null;
	}
}

/**
 * Perbandingan string tanpa kebocoran waktu (membandingkan HMAC dari keduanya).
 * @param {string} a
 * @param {string} b
 * @param {string} secret
 */
export async function safeEqual(a, b, secret) {
	const key = await importKey(secret);
	const [ha, hb] = await Promise.all([
		crypto.subtle.sign('HMAC', key, encoder.encode(a)),
		crypto.subtle.sign('HMAC', key, encoder.encode(b))
	]);
	const x = new Uint8Array(ha);
	const y = new Uint8Array(hb);
	let diff = 0;
	for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
	return diff === 0;
}

/** @param {string | undefined} list */
export function parseAdminEmails(list) {
	return (list ?? '')
		.split(',')
		.map((e) => e.trim().toLowerCase())
		.filter(Boolean);
}
