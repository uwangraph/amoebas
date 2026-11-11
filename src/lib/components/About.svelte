<script>
	import { reveal } from '$lib/actions/reveal';

	const stats = [
		{ value: 'Semua', label: 'Usia, dari anak-anak hingga dewasa' },
		{ value: '45′', label: 'Durasi per sesi latihan' },
		{ value: '10×', label: 'Pertemuan program member + sertifikat' }
	];

	const scrollToGallery = () =>
		document.querySelector('#gallery')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
</script>

<section id="about" class="relative bg-paper py-24 sm:py-36">
	<div class="mx-auto max-w-[1600px] px-4 sm:px-8">
		<div class="grid gap-10 lg:grid-cols-12">
			<div class="lg:col-span-3" use:reveal>
				<p class="eyebrow text-ink/70">Tentang Kami</p>
			</div>

			<div class="lg:col-span-9">
				<p
					use:reveal
					class="text-3xl leading-[1.1] font-medium tracking-[-0.03em] text-ink sm:text-5xl lg:text-6xl"
				>
					Amoebas Archery adalah tempat yang nyaman untuk belajar
					<span class="text-azure">berkuda</span> dan <span class="text-azure">memanah</span> —
					dalam suasana yang
					<span class="relative inline-block whitespace-nowrap">
						<span class="relative z-10">santai &amp; ramah.</span>
						<span class="absolute inset-x-0 bottom-[0.08em] -z-0 h-[0.35em] rounded-sm bg-sun"
						></span>
					</span>
				</p>

				<div class="mt-12 grid gap-8 sm:grid-cols-2" use:reveal={{ delay: 100 }}>
					<p class="text-lg leading-relaxed text-ink/65">
						Kami menawarkan pengalaman menyenangkan yang menggabungkan kedua aktivitas ini. Tim kami
						berpengalaman bertahun-tahun mendampingi pemula sampai yang ingin berlatih lebih serius.
					</p>
					<p class="text-lg leading-relaxed text-ink/65">
						Dengan peralatan yang memadai dan area latihan yang sesuai, olahraga berkuda dan panahan
						bisa dinikmati oleh semua usia.
					</p>
				</div>
			</div>
		</div>

		<!-- Gambar + statistik -->
		<div class="mt-20 grid gap-4 lg:mt-28 lg:grid-cols-12">
			<div
				use:reveal
				class="group relative overflow-hidden rounded-[2rem] bg-sky lg:col-span-8"
				data-cursor
			>
				<img
					src="img/hba.jpg"
					alt="Amoebas Archery - Berkuda dan Memanah"
					class="h-[420px] w-full object-cover transition-transform duration-[1500ms] ease-out-expo group-hover:scale-105 sm:h-[600px]"
					loading="lazy"
				/>
				<div
					class="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent"
				></div>
				<div
					class="absolute right-6 bottom-6 left-6 flex items-end justify-between gap-4 text-white"
				>
					<p class="display text-4xl sm:text-6xl">Horseback<br />Archery</p>
					<span class="rounded-full bg-sun px-4 py-2 text-sm font-semibold text-ink"
						>Banjaran, Bandung</span
					>
				</div>
			</div>

			<div class="grid gap-4 lg:col-span-4">
				{#each stats as s, i}
					<div
						use:reveal={{ delay: i * 100 }}
						class="flex flex-col justify-between rounded-[2rem] p-8 {i === 0
							? 'bg-azure text-white'
							: i === 1
								? 'bg-sun text-ink'
								: 'bg-white text-ink ring-1 ring-ink/5'}"
					>
						<span class="display text-6xl">{s.value}</span>
						<span class="mt-6 text-sm {i === 0 ? 'text-white/75' : 'text-ink/60'}">{s.label}</span>
					</div>
				{/each}
			</div>
		</div>

		<div class="mt-10 flex justify-end" use:reveal>
			<button on:click={scrollToGallery} class="btn-pill bg-ink !pr-2.5 text-white hover:bg-azure">
				Lihat Kegiatan Kami
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
