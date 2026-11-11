<script>
	import { onMount } from 'svelte';

	let enabled = false;
	let x = -100;
	let y = -100;
	let rx = -100;
	let ry = -100;
	let hovering = false;
	let visible = false;

	onMount(() => {
		// Hanya untuk perangkat dengan mouse
		if (!window.matchMedia('(pointer: fine)').matches) return;
		enabled = true;

		let raf;
		const loop = () => {
			rx += (x - rx) * 0.18;
			ry += (y - ry) * 0.18;
			raf = requestAnimationFrame(loop);
		};
		loop();

		const onMove = (e) => {
			x = e.clientX;
			y = e.clientY;
			visible = true;
			const t = /** @type {HTMLElement} */ (e.target);
			hovering = !!t.closest?.('a, button, input, textarea, label, [data-cursor]');
		};
		const onLeave = () => (visible = false);

		window.addEventListener('mousemove', onMove);
		document.addEventListener('mouseleave', onLeave);
		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener('mousemove', onMove);
			document.removeEventListener('mouseleave', onLeave);
		};
	});
</script>

{#if enabled}
	<div
		class="pointer-events-none fixed top-0 left-0 z-[100] mix-blend-difference transition-opacity duration-300"
		style="transform: translate3d({rx}px, {ry}px, 0); opacity: {visible ? 1 : 0};"
		aria-hidden="true"
	>
		<div
			class="-translate-x-1/2 -translate-y-1/2 rounded-full bg-white transition-[width,height] duration-300 ease-out-expo"
			style="width: {hovering ? 56 : 12}px; height: {hovering ? 56 : 12}px;"
		></div>
	</div>
{/if}
