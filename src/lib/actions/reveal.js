/**
 * Svelte action: menampilkan elemen dengan animasi saat masuk viewport.
 * Pemakaian: <div use:reveal={{ delay: 100 }}>
 * @param {HTMLElement} node
 * @param {{ delay?: number }} [opts]
 */
export function reveal(node, opts = {}) {
	node.setAttribute('data-reveal', '');
	if (opts.delay) node.style.setProperty('--reveal-delay', `${opts.delay}ms`);

	if (typeof IntersectionObserver === 'undefined') {
		node.classList.add('is-visible');
		return {};
	}

	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) {
					node.classList.add('is-visible');
					observer.unobserve(node);
				}
			}
		},
		{ threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
	);
	observer.observe(node);

	return {
		destroy() {
			observer.disconnect();
		}
	};
}
