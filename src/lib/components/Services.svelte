<script>
	import { reveal } from '$lib/actions/reveal';

	const services = [
		{
			id: 'riding',
			no: '01',
			title: 'Berkuda',
			subtitle: 'Horse Riding',
			description:
				'Pelajari seni berkuda dari dasar hingga mahir dengan instruktur bersertifikat. Program kami dirancang untuk semua usia dan tingkat pengalaman.',
			theme: 'blue',
			features: [
				'Kelas trial untuk pemula',
				'Program member dengan sertifikat',
				'Kelas kelompok dan keluarga',
				'Peralatan safety standar internasional'
			]
		},
		{
			id: 'archery',
			no: '02',
			title: 'Memanah',
			subtitle: 'Archery',
			description:
				'Temukan ketepatan dan fokus melalui seni memanah. Program kami mencakup semua tingkat dari pemula hingga kompetisi.',
			theme: 'yellow',
			features: [
				'Dengan pendampingan pelatih',
				'Latihan mandiri',
				'Sewa peralatan lengkap',
				'Program persiapan kompetisi'
			]
		}
	];

	const scrollTo = (id) =>
		document.querySelector(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
</script>

<section id="services" class="relative bg-white py-24 sm:py-36">
	<div class="mx-auto max-w-[1600px] px-4 sm:px-8">
		<div class="mb-16 flex flex-col justify-between gap-8 lg:mb-24 lg:flex-row lg:items-end">
			<div use:reveal>
				<p class="eyebrow mb-6 text-ink/70">Layanan Kami</p>
				<h2 class="display text-6xl text-ink sm:text-8xl lg:text-9xl">
					Layanan<br /><span class="text-azure">Kami</span>
				</h2>
			</div>
			<p use:reveal={{ delay: 100 }} class="max-w-md text-lg leading-relaxed text-ink/65">
				Berbagai pilihan program berkuda dan memanah yang dirancang untuk semua tingkat keahlian.
			</p>
		</div>

		<div class="grid gap-4 lg:grid-cols-2">
			{#each services as s, i}
				<article
					use:reveal={{ delay: i * 120 }}
					class="group relative flex min-h-[560px] flex-col overflow-hidden rounded-[2rem] p-8 transition-colors duration-700 ease-out-expo sm:p-12 {s.theme ===
					'blue'
						? 'bg-azure text-white'
						: 'bg-sun text-ink'}"
					data-cursor
				>
					<!-- Lingkaran dekoratif yang membesar saat hover -->
					<div
						class="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full transition-transform duration-[1200ms] ease-out-expo group-hover:scale-[2.2] {s.theme ===
						'blue'
							? 'bg-white/10'
							: 'bg-white/40'}"
					></div>

					<div class="relative flex items-start justify-between">
						<span class="text-sm font-semibold tabular-nums opacity-70">{s.no}</span>
						<span
							class="grid h-14 w-14 place-items-center rounded-full transition-transform duration-700 ease-out-expo group-hover:-rotate-45 {s.theme ===
							'blue'
								? 'bg-sun text-ink'
								: 'bg-ink text-white'}"
						>
							<svg
								class="h-5 w-5"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2.5"><path d="M5 12h14M13 6l6 6-6 6" /></svg
							>
						</span>
					</div>

					<div class="relative mt-auto">
						<p class="mb-2 text-lg font-medium opacity-70">{s.subtitle}</p>
						<h3 class="display mb-8 text-6xl sm:text-8xl">{s.title}</h3>
						<p class="mb-8 max-w-lg text-lg leading-relaxed opacity-80">{s.description}</p>

						<ul class="grid gap-2 sm:grid-cols-2">
							{#each s.features as f}
								<li
									class="flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium {s.theme ===
									'blue'
										? 'bg-white/10'
										: 'bg-ink/5'}"
								>
									<svg
										class="h-4 w-4 shrink-0"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="3"><path d="M5 13l4 4L19 7" /></svg
									>
									{f}
								</li>
							{/each}
						</ul>

						<button
							on:click={() => scrollTo('#contact')}
							class="mt-10 inline-flex items-center gap-2 border-b-2 border-current pb-1 text-base font-semibold transition-opacity hover:opacity-70"
						>
							Pelajari Lebih Lanjut
						</button>
					</div>
				</article>
			{/each}
		</div>

		<div class="mt-12 flex justify-center" use:reveal>
			<button
				on:click={() => scrollTo('#pricing')}
				class="btn-pill bg-ink !pr-2.5 text-white hover:bg-azure"
			>
				Lihat Semua Paket
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
		</div>
	</div>
</section>
