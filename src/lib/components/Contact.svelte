<script>
	import { reveal } from '$lib/actions/reveal';

	let name = '';
	let email = '';
	let message = '';

	function handleSubmit() {
		// Format pesan untuk WhatsApp
		const whatsappMessage = `Halo Amoebas Archery!%0A%0ANama: ${name}%0AEmail: ${email}%0APesan: ${message}%0A%0ASaya tertarik dengan layanan berkuda dan memanah di Amoebas Archery.`;
		const phoneNumber = '628112101290';
		window.open(`https://wa.me/${phoneNumber}?text=${whatsappMessage}`, '_blank');

		name = '';
		email = '';
		message = '';
	}

	const socials = [
		{ name: 'Instagram', href: 'https://instagram.com/@amoebas.archery' },
		{ name: 'TikTok', href: 'https://tiktok.com/@amoebas.archery' },
		{ name: 'YouTube', href: 'https://youtube.com/@amoebasarchery' }
	];
</script>

<section id="contact" class="relative overflow-hidden bg-navy py-24 text-white sm:py-36">
	<div
		class="pointer-events-none absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-azure opacity-60 blur-[120px]"
	></div>
	<div
		class="pointer-events-none absolute -bottom-60 -left-40 h-[500px] w-[500px] rounded-full bg-sun opacity-15 blur-[120px]"
	></div>

	<div class="relative mx-auto max-w-[1600px] px-4 sm:px-8">
		<div use:reveal>
			<p class="eyebrow mb-6 text-white/70">Hubungi Kami</p>
			<h2 class="display text-[16vw] sm:text-[11vw] lg:text-[9vw]">
				Mari <span class="text-sun">terhubung</span>
			</h2>
			<p class="mt-6 max-w-xl text-lg text-white/65">
				Punya pertanyaan atau ingin mendaftar? Hubungi kami melalui WhatsApp atau kunjungi langsung.
			</p>
		</div>

		<div class="mt-16 grid gap-12 border-t border-white/15 pt-12 lg:grid-cols-12 lg:gap-8">
			<!-- Info kontak -->
			<div class="space-y-10 lg:col-span-4" use:reveal>
				<div>
					<p class="mb-2 text-sm text-white/50">Telepon / WhatsApp</p>
					<a
						href="https://wa.me/628112101290"
						target="_blank"
						rel="noopener noreferrer"
						class="text-3xl font-semibold tracking-tight transition-colors hover:text-sun"
						>0811 2101 290</a
					>
				</div>
				<div>
					<p class="mb-2 text-sm text-white/50">Lokasi</p>
					<p class="max-w-xs text-xl leading-snug">
						Cae, Kiangroke, Kec. Banjaran, Kab. Bandung, Jawa Barat 40377
					</p>
				</div>
				<div>
					<p class="mb-3 text-sm text-white/50">Media Sosial</p>
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
					</div>
				</div>
			</div>

			<!-- Form -->
			<form
				on:submit|preventDefault={handleSubmit}
				class="space-y-8 lg:col-span-7 lg:col-start-6"
				use:reveal={{ delay: 120 }}
			>
				<div class="grid gap-8 sm:grid-cols-2">
					<label class="block">
						<span class="mb-2 block text-sm text-white/50">Nama Lengkap</span>
						<input
							type="text"
							id="name"
							bind:value={name}
							class="line-field"
							placeholder="Nama Anda"
							required
						/>
					</label>
					<label class="block">
						<span class="mb-2 block text-sm text-white/50">Email</span>
						<input
							type="email"
							id="email"
							bind:value={email}
							class="line-field"
							placeholder="nama@email.com"
							required
						/>
					</label>
				</div>
				<label class="block">
					<span class="mb-2 block text-sm text-white/50">Pesan</span>
					<textarea
						id="message"
						bind:value={message}
						rows="3"
						class="line-field resize-none"
						placeholder="Tulis pesan Anda di sini..."
						required
					></textarea>
				</label>

				<button
					type="submit"
					class="btn-pill bg-sun !py-4 !pr-3 !pl-8 text-base text-ink hover:bg-white"
				>
					Kirim via WhatsApp
					<span class="btn-icon !h-9 !w-9 bg-ink text-white">
						<svg
							class="h-4 w-4"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.5"><path d="M5 12h14M13 6l6 6-6 6" /></svg
						>
					</span>
				</button>
			</form>
		</div>
	</div>
</section>

<style>
	.line-field {
		width: 100%;
		background: transparent;
		border: 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.25);
		padding: 0.5rem 0 0.9rem;
		font-size: 1.375rem;
		color: #fff;
		outline: none;
		transition: border-color 0.3s;
	}
	.line-field::placeholder {
		color: rgba(255, 255, 255, 0.3);
	}
	.line-field:focus {
		border-bottom-color: var(--color-sun);
	}
</style>
