<script>
	const words = [
		'Berkuda',
		'Memanah',
		'Horseback Archery',
		'Fun Riding',
		'Kelas Grup',
		'Semua Usia'
	];
</script>

<div
	class="relative overflow-hidden border-y border-ink/10 bg-sun py-5 text-ink"
	aria-hidden="true"
>
	<div class="animate-marquee flex w-max items-center whitespace-nowrap">
		{#each [0, 1] as _}
			{#each words as word}
				<span class="px-8 text-3xl font-semibold tracking-tight md:text-5xl">{word}</span>
				<svg
					class="h-6 w-6 shrink-0 text-azure md:h-8 md:w-8"
					viewBox="0 0 24 24"
					fill="currentColor"
				>
					<path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6z" />
				</svg>
			{/each}
		{/each}
	</div>
</div>
