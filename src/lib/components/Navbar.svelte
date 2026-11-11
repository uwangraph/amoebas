<script>
	import LoginModal from './LoginModal.svelte';
	import { onMount } from 'svelte';
	import { isAdmin, logout } from '$lib/auth';

	let logoClickCount = 0;
	let logoClickTimeout;
	let isMenuOpen = false;
	let scrollY = 0;
	let lastScrollY = 0;
	let showNavbar = true;
	let loginModal;
	let adminStatus = false;

	let activeSection = '#home';

	const navItems = [
		{ name: 'Home', href: '#home' },
		{ name: 'About', href: '#about' },
		{ name: 'Services', href: '#services' },
		{ name: 'Pricing', href: '#pricing' },
		{ name: 'Gallery', href: '#gallery' },
		{ name: 'Contact', href: '#contact' }
	];

	const socials = [
		{ name: 'Instagram', href: 'https://instagram.com/@amoebas.archery' },
		{ name: 'TikTok', href: 'https://tiktok.com/@amoebas.archery' },
		{ name: 'YouTube', href: 'https://youtube.com/@amoebasarchery' }
	];

	onMount(() => {
		const unsubscribe = isAdmin.subscribe((value) => {
			adminStatus = value;
		});

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) activeSection = `#${entry.target.id}`;
				});
			},
			{ threshold: [0.3, 0.6], rootMargin: '0px 0px -30% 0px' }
		);

		navItems.forEach((item) => {
			const el = document.querySelector(item.href);
			if (el) observer.observe(el);
		});

		return () => {
			unsubscribe();
			observer.disconnect();
		};
	});

	// Klik 1x = ke atas, klik 3x = buka login admin
	const handleLogoClick = () => {
		logoClickCount++;
		clearTimeout(logoClickTimeout);

		if (logoClickCount === 1) {
			logoClickTimeout = setTimeout(() => {
				window.scrollTo({ top: 0, behavior: 'smooth' });
				logoClickCount = 0;
			}, 800);
		} else if (logoClickCount === 3) {
			if (!adminStatus) loginModal?.open();
			logoClickCount = 0;
		} else if (logoClickCount > 3) {
			logoClickCount = 0;
		}
	};

	const scrollToSection = (href) => {
		isMenuOpen = false;
		document.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	};

	const handleLogout = async () => {
		try {
			await logout();
			adminStatus = false;
		} catch (error) {
			console.error('Logout error:', error);
		}
	};

	const handleLoginSuccess = () => {
		adminStatus = true;
	};

	const handleKeydown = (e) => {
		if (e.key === 'Escape' && isMenuOpen) isMenuOpen = false;
	};

	$: {
		showNavbar = isMenuOpen || !(scrollY > lastScrollY && scrollY > 120);
		lastScrollY = scrollY;
	}

	$: if (typeof document !== 'undefined') {
		document.body.style.overflow = isMenuOpen ? 'hidden' : '';
	}
</script>

<svelte:window bind:scrollY on:keydown={handleKeydown} />

<nav
	class="fixed inset-x-0 top-0 z-50 transition-transform duration-500 ease-out-expo"
	class:-translate-y-full={!showNavbar}
>
	<div class="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-4 sm:px-8 sm:py-6">
		<!-- Logo -->
		<button
			on:click={handleLogoClick}
			class="group flex items-center gap-3 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-azure"
			title="Amoebas Archery"
			aria-label="Amoebas Archery, kembali ke atas"
		>
			<span
				class="grid h-11 w-11 place-items-center rounded-full transition-all duration-500 ease-out-expo group-hover:rotate-90 {isMenuOpen
					? 'bg-sun text-ink'
					: 'bg-azure text-white'}"
			>
				<!-- Ikon target -->
				<svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="12" r="9" />
					<circle cx="12" cy="12" r="5" />
					<circle cx="12" cy="12" r="1.5" fill="currentColor" />
				</svg>
			</span>
			<span
				class="hidden text-left leading-none font-semibold tracking-tight transition-colors duration-500 sm:block {isMenuOpen
					? 'text-white'
					: 'text-ink'}"
			>
				<span class="block text-lg">Amoebas</span>
				<span class="block text-[11px] tracking-[0.3em] uppercase opacity-60">Archery</span>
			</span>
		</button>

		<!-- Desktop -->
		<div class="flex items-center gap-2">
			<div
				class="hidden items-center gap-1 rounded-full bg-white/80 p-1.5 shadow-[0_8px_30px_rgba(10,15,46,0.06)] ring-1 ring-ink/5 backdrop-blur-xl lg:flex"
				class:opacity-0={isMenuOpen}
				class:pointer-events-none={isMenuOpen}
			>
				{#each navItems.slice(1, 5) as item}
					<button
						on:click={() => scrollToSection(item.href)}
						class="rounded-full px-4 py-2 text-sm font-medium transition-colors duration-300 {activeSection ===
						item.href
							? 'bg-ink text-white'
							: 'text-ink hover:bg-sky'}"
					>
						{item.name}
					</button>
				{/each}
			</div>

			{#if adminStatus}
				<button
					on:click={handleLogout}
					class="hidden rounded-full bg-white px-4 py-3 text-sm font-semibold text-red-600 ring-1 ring-red-200 transition-colors hover:bg-red-50 sm:block"
				>
					Logout Admin
				</button>
			{/if}

			<button
				on:click={() => scrollToSection('#contact')}
				class="btn-pill hidden bg-azure !py-2.5 !pr-2.5 text-white hover:bg-ink md:inline-flex"
				class:opacity-0={isMenuOpen}
				class:pointer-events-none={isMenuOpen}
			>
				Hubungi Kami
				<span class="btn-icon bg-sun text-ink">
					<svg
						class="h-3.5 w-3.5"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.5"><path d="M5 12h14M13 6l6 6-6 6" /></svg
					>
				</span>
			</button>

			<!-- Tombol menu -->
			<button
				on:click={() => (isMenuOpen = !isMenuOpen)}
				class="group flex h-12 items-center gap-3 rounded-full pr-5 pl-5 text-sm font-semibold shadow-[0_8px_30px_rgba(10,15,46,0.06)] ring-1 transition-colors duration-500 {isMenuOpen
					? 'bg-sun text-ink ring-sun'
					: 'bg-white text-ink ring-ink/5'}"
				aria-label="Toggle menu"
				aria-expanded={isMenuOpen}
			>
				<span class="hidden sm:inline">{isMenuOpen ? 'Tutup' : 'Menu'}</span>
				<span class="relative block h-3 w-5">
					<span
						class="absolute left-0 h-0.5 w-5 rounded bg-current transition-all duration-500 ease-out-expo {isMenuOpen
							? 'top-1/2 -translate-y-1/2 rotate-45'
							: 'top-0'}"
					></span>
					<span
						class="absolute left-0 h-0.5 w-5 rounded bg-current transition-all duration-500 ease-out-expo {isMenuOpen
							? 'top-1/2 -translate-y-1/2 -rotate-45'
							: 'top-full -translate-y-full'}"
					></span>
				</span>
			</button>
		</div>
	</div>
</nav>

<!-- Menu fullscreen -->
<div
	class="fixed inset-0 z-40 bg-navy text-white transition-[clip-path] duration-700 ease-out-expo"
	style="clip-path: {isMenuOpen ? 'circle(150% at 100% 0%)' : 'circle(0% at 100% 0%)'};"
	aria-hidden={!isMenuOpen}
	inert={!isMenuOpen}
>
	<div class="mx-auto flex h-full max-w-[1600px] flex-col justify-between px-4 pt-28 pb-8 sm:px-8">
		<ul class="space-y-1">
			{#each navItems as item, i}
				<li
					class="overflow-hidden transition-all duration-700 ease-out-expo"
					style="transition-delay: {isMenuOpen
						? 150 + i * 50
						: 0}ms; transform: translateY({isMenuOpen ? 0 : 40}px); opacity: {isMenuOpen ? 1 : 0};"
				>
					<button
						on:click={() => scrollToSection(item.href)}
						class="group flex w-full items-baseline gap-4 text-left sm:gap-8"
					>
						<span class="w-8 text-sm text-white/40 tabular-nums">0{i + 1}</span>
						<span
							class="display text-5xl transition-all duration-500 ease-out-expo group-hover:translate-x-4 group-hover:text-sun sm:text-7xl lg:text-8xl {activeSection ===
							item.href
								? 'text-sun'
								: ''}"
						>
							{item.name}
						</span>
					</button>
				</li>
			{/each}
		</ul>

		<div
			class="flex flex-col gap-6 border-t border-white/15 pt-6 sm:flex-row sm:items-end sm:justify-between"
		>
			<div class="flex flex-wrap gap-2">
				{#each socials as s}
					<a
						href={s.href}
						target="_blank"
						rel="noopener noreferrer"
						class="rounded-full border border-white/20 px-4 py-2 text-sm transition-colors hover:border-sun hover:bg-sun hover:text-ink"
						>{s.name}</a
					>
				{/each}
				{#if adminStatus}
					<button
						on:click={handleLogout}
						class="rounded-full border border-red-400/50 px-4 py-2 text-sm text-red-300 transition-colors hover:bg-red-500 hover:text-white"
					>
						Logout Admin
					</button>
				{/if}
			</div>
			<p class="text-sm text-white/50">Banjaran, Kab. Bandung · 0811 2101 290</p>
		</div>
	</div>
</div>

<LoginModal bind:this={loginModal} on:loginSuccess={handleLoginSuccess} />
