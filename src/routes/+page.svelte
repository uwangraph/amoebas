<script>
	import Navbar from '$lib/components/Navbar.svelte';
	import Hero from '$lib/components/Hero.svelte';
	import Marquee from '$lib/components/Marquee.svelte';
	import About from '$lib/components/About.svelte';
	import Services from '$lib/components/Services.svelte';
	import Pricing from '$lib/components/Pricing.svelte';
	import Gallery from '$lib/components/Gallery.svelte';
	import Contact from '$lib/components/Contact.svelte';
	import Footer from '$lib/components/Footer.svelte';
</script>

<svelte:head>
	<title>Amoebas Archery - Professional Archery & Horse Riding</title>
	<meta
		name="description"
		content="Experience professional archery and horse riding at Amoebas Archery. Modern facilities with expert instructors."
	/>
	<meta name="keywords" content="archery, horse riding, professional training, Amoebas Archery" />
</svelte:head>

<Navbar />

<main>
	<Hero />
	<Marquee />
	<About />
	<Services />
	<Pricing />
	<Gallery />
	<Contact />
</main>

<Footer />
