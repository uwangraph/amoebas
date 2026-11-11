<script>
	const links = [
		{ name: 'Tentang Kami', href: '#about' },
		{ name: 'Layanan', href: '#services' },
		{ name: 'Paket Harga', href: '#pricing' },
		{ name: 'Galeri', href: '#gallery' },
		{ name: 'Kontak', href: '#contact' }
	];
	const socials = [
		{ name: 'Instagram', href: 'https://instagram.com/@amoebas.archery' },
		{ name: 'TikTok', href: 'https://tiktok.com/@amoebas.archery' },
		{ name: 'YouTube', href: 'https://youtube.com/@amoebasarchery' }
	];
	const year = new Date().getFullYear();
</script>

<footer class="relative overflow-hidden bg-azure text-white">
	<div class="mx-auto max-w-[1600px] px-4 pt-20 pb-8 sm:px-8">
		<div class="grid gap-12 md:grid-cols-12">
			<p class="max-w-sm text-2xl leading-snug font-medium tracking-tight md:col-span-5">
				Tempat yang nyaman untuk belajar berkuda dan memanah dengan suasana santai dan ramah.
			</p>

			<div class="md:col-span-3 md:col-start-7">
				<p class="mb-4 text-sm text-white/60">Navigasi</p>
				<ul class="space-y-2">
					{#each links as l}
						<li><a href={l.href} class="text-lg transition-colors hover:text-sun">{l.name}</a></li>
					{/each}
				</ul>
			</div>

			<div class="md:col-span-3">
				<p class="mb-4 text-sm text-white/60">Ikuti Kami</p>
				<ul class="space-y-2">
					{#each socials as s}
						<li>
							<a
								href={s.href}
								target="_blank"
								rel="noopener noreferrer"
								class="text-lg transition-colors hover:text-sun">{s.name} ↗</a
							>
						</li>
					{/each}
				</ul>
				<p class="mt-6 text-sm text-white/60">0811 2101 290</p>
			</div>
		</div>

		<!-- Wordmark besar -->
		<p
			class="display mt-20 text-[19vw] leading-[0.8] tracking-[-0.06em] select-none"
			aria-hidden="true"
		>
			Amoebas<span class="text-sun">.</span>
		</p>

		<div
			class="mt-8 flex flex-col justify-between gap-2 border-t border-white/20 pt-6 text-sm text-white/60 sm:flex-row"
		>
			<span>© {year} Amoebas Archery. All rights reserved.</span>
			<span class="flex flex-wrap gap-x-4">
				<span>Banjaran, Kab. Bandung, Jawa Barat</span>
				<a
					href="/models/CREDITS.txt"
					target="_blank"
					rel="noopener"
					class="underline-offset-4 hover:text-sun hover:underline">Kredit model 3D</a
				>
			</span>
		</div>
	</div>
</footer>
