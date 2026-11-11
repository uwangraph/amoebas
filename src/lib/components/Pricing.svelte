<script>
	import { reveal } from '$lib/actions/reveal';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	const categories = [
		{
			id: 'riding',
			name: 'Horse Riding',
			items: [
				{ type: 'TRIAL', price: '180K', description: 'per pertemuan, @ 45 menit' },
				{ type: 'MEMBER', price: '1.250K', description: '10 pertemuan, @ 45 menit, sertifikat' }
			]
		},
		{
			id: 'hba',
			name: 'Horseback Archery',
			items: [
				{ type: 'TRIAL', price: '150K', description: 'per pertemuan, @ 45 menit' },
				{ type: 'MEMBER', price: '1.400K', description: '10 pertemuan, @ 45 menit, sertifikat' }
			]
		},
		{
			id: 'group',
			name: 'Paket Grup',
			items: [
				{
					type: 'PENGENALAN & MENUNGGANG',
					price: '450K',
					description: 'per 1 kuda, 3 jam, 10 orang'
				},
				{ type: 'PEMANTAPAN', price: '450K', description: 'per 1 kuda, 3 jam, 5 orang' }
			]
		},
		{
			id: 'coach',
			name: 'Archery + Pelatih',
			items: [
				{ type: 'TRIAL', price: '45K', description: 'bawa alat sendiri' },
				{ type: 'BASIC', price: '400K', description: '10 pertemuan' },
				{ type: 'COMPETITION', price: '65K', description: 'bawa alat sendiri' }
			]
		},
		{
			id: 'self',
			name: 'Mandiri & Sewa',
			items: [
				{ type: 'MANDIRI', price: '15K', description: 'per 2 jam, bawa alat sendiri' },
				{ type: 'SEWA ALAT', price: '25K', description: 'per 1 jam, busur + 6 arrow + quiver' }
			]
		},
		{
			id: 'other',
			name: 'Lainnya',
			items: [
				{ type: 'FUN RIDING', price: '15K', description: '2 helling circle track' },
				{ type: 'ENDURANCE AND TRACKING', price: 'Hubungi CP', description: 'Penawaran khusus' }
			]
		}
	];

	let active = categories[0].id;
	$: current = categories.find((c) => c.id === active);

	const book = () =>
		document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
</script>

<section id="pricing" class="relative bg-paper py-24 sm:py-36">
	<div class="mx-auto max-w-[1600px] px-4 sm:px-8">
		<div class="mb-14 grid gap-8 lg:grid-cols-12 lg:items-end">
			<div class="lg:col-span-7" use:reveal>
				<p class="eyebrow mb-6 text-ink/70">Paket Harga</p>
				<h2 class="display text-6xl text-ink sm:text-8xl">
					Pilih paket<br /><span class="text-azure">terbaik</span> Anda
				</h2>
			</div>
			<p
				class="text-lg leading-relaxed text-ink/65 lg:col-span-4 lg:col-start-9"
				use:reveal={{ delay: 100 }}
			>
				Pilih paket yang sesuai dengan kebutuhan Anda. Diskon khusus tersedia untuk grup dan member
				jangka panjang.
			</p>
		</div>

		<!-- Tab kategori -->
		<div class="-mx-4 mb-8 overflow-x-auto px-4 sm:mx-0 sm:px-0" use:reveal>
			<div class="flex w-max gap-2" role="tablist" aria-label="Kategori harga">
				{#each categories as c}
					<button
						role="tab"
						aria-selected={active === c.id}
						on:click={() => (active = c.id)}
						class="rounded-full px-5 py-3 text-sm font-semibold whitespace-nowrap transition-colors duration-300 {active ===
						c.id
							? 'bg-azure text-white'
							: 'bg-white text-ink ring-1 ring-ink/10 hover:bg-sky'}"
					>
						{c.name}
					</button>
				{/each}
			</div>
		</div>

		<!-- Daftar harga -->
		<div class="overflow-hidden rounded-[2rem] bg-white ring-1 ring-ink/5" use:reveal>
			<div class="flex items-center justify-between border-b border-ink/10 px-6 py-5 sm:px-10">
				<h3 class="text-xl font-semibold tracking-tight">{current.name}</h3>
				<span class="text-sm text-ink/50">{current.items.length} pilihan</span>
			</div>

			{#key active}
				<ul>
					{#each current.items as item, i}
						<li
							in:fly={{ y: 24, duration: 600, delay: i * 70, easing: cubicOut }}
							class="group grid grid-cols-[1fr_auto] items-center gap-4 border-b border-ink/10 px-6 py-7 transition-colors duration-300 last:border-0 hover:bg-sun sm:grid-cols-12 sm:px-10 sm:py-9"
						>
							<span class="hidden text-sm text-ink/40 tabular-nums sm:col-span-1 sm:block"
								>0{i + 1}</span
							>
							<div class="sm:col-span-6">
								<h4 class="text-xl font-semibold tracking-tight sm:text-2xl">{item.type}</h4>
								<p class="mt-1 text-sm text-ink/55 group-hover:text-ink/75">{item.description}</p>
							</div>
							<span
								class="display text-right text-4xl text-azure transition-colors group-hover:text-ink sm:col-span-4 sm:text-6xl"
							>
								{item.price}
							</span>
							<button
								on:click={book}
								class="hidden h-12 w-12 place-items-center justify-self-end rounded-full bg-ink text-white transition-transform duration-500 ease-out-expo group-hover:-rotate-45 sm:col-span-1 sm:grid"
								aria-label="Pesan {item.type}"
							>
								<svg
									class="h-4 w-4"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2.5"><path d="M5 12h14M13 6l6 6-6 6" /></svg
								>
							</button>
						</li>
					{/each}
				</ul>
			{/key}
		</div>

		<p class="mt-8 text-sm text-ink/50">
			* Harga dapat berubah sewaktu-waktu. Hubungi kami untuk informasi terbaru.
		</p>
	</div>
</section>
