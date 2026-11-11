<script>
	import { onMount } from 'svelte';

	let canvas;
	let section;
	let mounted = false;
	let currentTextIndex = 0;
	let isTyping = false;

	const dynamicTexts = [
		'Pengalaman berkuda dan memanah profesional',
		'Traditional archery with modern facilities',
		'Horseback riding adventures await',
		'Master the art of bow and arrow'
	];

	const scrollToSection = (id) =>
		document.querySelector(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

	let sceneReady = false;

	onMount(() => {
		mounted = true;

		const textInterval = setInterval(() => {
			isTyping = true;
			setTimeout(() => {
				currentTextIndex = (currentTextIndex + 1) % dynamicTexts.length;
				isTyping = false;
			}, 400);
		}, 4000);

		// Muat three.js hanya di browser, terpisah dari bundle utama
		let destroyed = false;
		let stopScene = () => {};
		import('$lib/three/horseArcher.js')
			.then(({ createHorseArcher }) => {
				if (destroyed) return;
				stopScene = createHorseArcher(canvas, {
					reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
					onReady: () => (sceneReady = true),
					interactionTarget: section
				});
			})
			.catch((err) => console.warn('Adegan 3D tidak dapat dimuat:', err));

		return () => {
			destroyed = true;
			clearInterval(textInterval);
			stopScene();
		};
	});
</script>

<section
	id="home"
	bind:this={section}
	class="relative flex min-h-[100svh] cursor-crosshair flex-col overflow-hidden bg-paper"
>
	<!-- Latar gradasi lembut -->
	<div
		class="pointer-events-none absolute inset-0"
		style="background: radial-gradient(60% 60% at 75% 40%, rgba(31,59,255,0.12), transparent 70%), radial-gradient(40% 40% at 90% 90%, rgba(255,210,31,0.18), transparent 70%);"
	></div>

	<!-- Adegan 3D pemanah berkuda -->
	<canvas
		bind:this={canvas}
		class="pointer-events-none absolute inset-x-0 top-16 h-[46%] w-full transition-opacity duration-[1600ms] ease-out-expo md:inset-0 md:h-full"
		class:opacity-0={!sceneReady}
		aria-hidden="true"
	></canvas>

	<!-- Petunjuk interaksi -->
	<p
		class="pointer-events-none absolute top-24 right-4 z-10 flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-xs font-medium text-ink/70 shadow-[0_8px_30px_rgba(10,15,46,0.06)] ring-1 ring-ink/5 backdrop-blur transition-opacity delay-700 duration-1000 motion-reduce:hidden sm:right-8 md:top-28"
		class:opacity-0={!sceneReady}
	>
		<span class="h-1.5 w-1.5 animate-pulse rounded-full bg-sun"></span>
		<span class="pointer-coarse:hidden">Arahkan kursor untuk membidik · klik untuk memanah</span>
		<span class="hidden pointer-coarse:inline">Ketuk untuk membidik &amp; memanah</span>
	</p>

	<div
		class="relative z-10 mx-auto flex w-full max-w-[1600px] flex-1 flex-col justify-end px-4 pt-32 pb-10 sm:px-8 sm:pb-14"
	>
		<div
			class="transition-all duration-[1400ms] ease-out-expo"
			class:opacity-0={!mounted}
			class:translate-y-12={!mounted}
		>
			<p class="eyebrow mb-6 text-ink/70">Amoebas Archery — Banjaran, Bandung</p>

			<h1 class="display text-[17vw] text-ink sm:text-[13vw] lg:text-[10.5vw]">
				<span class="block">Berkuda</span>
				<span class="block">
					<span class="text-azure">&amp;</span> Memanah<span class="text-sun">.</span>
				</span>
			</h1>
		</div>

		<div
			class="mt-10 grid gap-8 border-t border-ink/10 pt-6 transition-all delay-300 duration-[1400ms] ease-out-expo md:grid-cols-12 md:items-end"
			class:opacity-0={!mounted}
		>
			<p class="h-14 text-lg leading-snug text-ink/70 md:col-span-5 md:text-xl">
				<span class="font-semibold text-ink">Kuda &amp; Panah —</span>
				<span
					class="inline-block transition-all duration-400 ease-out-expo"
					class:opacity-0={isTyping}
					class:translate-y-2={isTyping}
				>
					{dynamicTexts[currentTextIndex]}
				</span>
			</p>

			<div class="flex flex-wrap gap-3 md:col-span-4 md:col-start-6">
				<button
					on:click={() => scrollToSection('#services')}
					class="btn-pill bg-ink !pr-2.5 text-white hover:bg-azure"
				>
					Jelajahi Layanan
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
				<button
					on:click={() => scrollToSection('#pricing')}
					class="btn-pill bg-white text-ink ring-1 ring-ink/10 hover:bg-sun"
				>
					Lihat Harga
				</button>
			</div>

			<button
				on:click={() => scrollToSection('#about')}
				class="group hidden items-center justify-end gap-3 text-sm font-medium text-ink/60 hover:text-ink md:col-span-3 md:flex"
			>
				Scroll untuk menjelajah
				<span
					class="grid h-10 w-10 place-items-center rounded-full border border-ink/15 transition-colors group-hover:border-azure group-hover:bg-azure group-hover:text-white"
				>
					<svg
						class="h-4 w-4 animate-bounce"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"><path d="M12 5v14M6 13l6 6 6-6" /></svg
					>
				</span>
			</button>
		</div>
	</div>
</section>
