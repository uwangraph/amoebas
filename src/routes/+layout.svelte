<script>
	import '../app.css';
	import { onMount } from 'svelte';
	import { initAuth } from '$lib/auth';
	import Cursor from '$lib/components/Cursor.svelte';

	onMount(() => {
		initAuth();
	});
</script>

<svelte:head>
	<title>Amoebas Archery - Berkuda & Memanah</title>
</svelte:head>

<Cursor />

<div class="min-h-screen">
	<slot />
</div>
