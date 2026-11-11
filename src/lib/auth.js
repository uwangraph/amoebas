import { writable } from 'svelte/store';

// Store untuk state admin (email admin yang login, atau null)
export const user = writable(null);
export const isAdmin = writable(false);

/** @param {string | null} email */
const setAdmin = (email) => {
	user.set(email ? { email } : null);
	isAdmin.set(!!email);
};

/** @param {Response} res */
async function readError(res) {
	const data = await res.json().catch(() => null);
	return new Error(data?.message || `Request gagal (${res.status})`);
}

// Login
export const login = async (email, password) => {
	const res = await fetch('/api/auth', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ email, password })
	});
	if (!res.ok) throw await readError(res);
	const { admin } = await res.json();
	setAdmin(admin);
	return { email: admin };
};

// Logout
export const logout = async () => {
	const res = await fetch('/api/auth', { method: 'DELETE' });
	if (!res.ok) throw await readError(res);
	setAdmin(null);
};

// Ambil sesi saat ini
export const getSession = async () => {
	const res = await fetch('/api/auth');
	if (!res.ok) throw await readError(res);
	const { admin } = await res.json();
	return admin ? { user: { email: admin } } : null;
};

// Inisialisasi saat app pertama kali load
export const initAuth = async () => {
	try {
		const session = await getSession();
		setAdmin(session?.user.email ?? null);
	} catch (err) {
		console.error('Gagal memeriksa sesi:', err);
		setAdmin(null);
	}
};
