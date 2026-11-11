<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { logout, user, isAdmin } from '$lib/auth';

	export let data;

	const ALLOWED = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];
	const MAX_SIZE = 5 * 1024 * 1024;

	// Antrean upload: { id, file, url, title, status: 'siap'|'upload'|'selesai'|'gagal', progress, error }
	let queue = [];
	let uploading = false;
	let dragging = false;
	let fileInput;

	// Foto yang sudah ada di galeri
	let images = [];
	let loadingImages = true;
	let toDelete = null;
	let deleting = false;

	// Toast
	let toastMsg = '';
	let toastType = 'success';
	let showToast = false;
	let toastTimer;
	const notify = (msg, type = 'success', ms = 2800) => {
		toastMsg = msg;
		toastType = type;
		showToast = true;
		clearTimeout(toastTimer);
		toastTimer = setTimeout(() => (showToast = false), ms);
	};

	const readError = async (res) => {
		const d = await res.json().catch(() => null);
		return new Error(d?.message || `Request gagal (${res.status})`);
	};
	const fmtSize = (b) =>
		b < 1024 * 1024 ? `${Math.round(b / 1024)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`;

	// Pastikan state client ikut menandai admin (halaman dibuka langsung lewat URL)
	$: if (data?.admin) {
		user.set({ email: data.admin });
		isAdmin.set(true);
	}

	async function fetchImages() {
		loadingImages = true;
		try {
			const res = await fetch('/api/gallery');
			if (!res.ok) throw await readError(res);
			images = (await res.json()).images;
		} catch (err) {
			console.error(err);
			notify('Gagal memuat galeri', 'error');
		} finally {
			loadingImages = false;
		}
	}

	onMount(() => {
		fetchImages();
		const warn = (e) => {
			if (uploading) {
				e.preventDefault();
				e.returnValue = '';
			}
		};
		window.addEventListener('beforeunload', warn);
		return () => {
			window.removeEventListener('beforeunload', warn);
			queue.forEach((q) => URL.revokeObjectURL(q.url));
		};
	});

	// ---------- Antrean ----------
	function addFiles(fileList) {
		const added = [];
		const rejected = [];
		for (const file of Array.from(fileList ?? [])) {
			if (!ALLOWED.includes(file.type)) rejected.push(`${file.name}: format tidak didukung`);
			else if (file.size > MAX_SIZE) rejected.push(`${file.name}: lebih dari 5MB`);
			else
				added.push({
					id: crypto.randomUUID(),
					file,
					url: URL.createObjectURL(file),
					title: '',
					status: 'siap',
					progress: 0,
					error: ''
				});
		}
		queue = [...queue, ...added];
		if (rejected.length) notify(rejected.join(' · '), 'error', 5000);
	}

	function removeFromQueue(id) {
		const item = queue.find((q) => q.id === id);
		if (item) URL.revokeObjectURL(item.url);
		queue = queue.filter((q) => q.id !== id);
	}

	const patch = (id, changes) => {
		queue = queue.map((q) => (q.id === id ? { ...q, ...changes } : q));
	};

	// XHR dipakai agar progres upload bisa ditampilkan
	function sendOne(item) {
		return new Promise((resolve, reject) => {
			const form = new FormData();
			form.append('file', item.file);
			if (item.title.trim()) form.append('title', item.title.trim());

			const xhr = new XMLHttpRequest();
			xhr.open('POST', '/api/gallery');
			xhr.upload.onprogress = (e) => {
				if (e.lengthComputable)
					patch(item.id, { progress: Math.round((e.loaded / e.total) * 100) });
			};
			xhr.onload = () => {
				let body = null;
				try {
					body = JSON.parse(xhr.responseText);
				} catch {}
				if (xhr.status >= 200 && xhr.status < 300) resolve(body.image);
				else reject(new Error(body?.message || `Upload gagal (${xhr.status})`));
			};
			xhr.onerror = () => reject(new Error('Koneksi terputus'));
			xhr.send(form);
		});
	}

	async function uploadAll() {
		if (uploading) return;
		const pending = queue.filter((q) => q.status === 'siap' || q.status === 'gagal');
		if (!pending.length) return;
		uploading = true;
		let ok = 0;
		let failed = 0;
		for (const item of pending) {
			patch(item.id, { status: 'upload', progress: 0, error: '' });
			try {
				const image = await sendOne(item);
				patch(item.id, { status: 'selesai', progress: 100 });
				images = [image, ...images];
				ok++;
			} catch (err) {
				patch(item.id, { status: 'gagal', error: err.message });
				failed++;
			}
		}
		uploading = false;
		if (ok) notify(`${ok} foto berhasil diupload 🎉`);
		if (failed) notify(`${failed} foto gagal diupload`, 'error', 4000);
		// Bersihkan yang sudah selesai setelah sejenak
		setTimeout(() => {
			queue.filter((q) => q.status === 'selesai').forEach((q) => URL.revokeObjectURL(q.url));
			queue = queue.filter((q) => q.status !== 'selesai');
		}, 1800);
	}

	// ---------- Drag & drop ----------
	const onDrop = (e) => {
		e.preventDefault();
		dragging = false;
		addFiles(e.dataTransfer?.files);
	};
	const onPaste = (e) => {
		const files = Array.from(e.clipboardData?.files ?? []);
		if (files.length) addFiles(files);
	};

	// ---------- Hapus ----------
	async function confirmDelete() {
		if (!toDelete) return;
		deleting = true;
		try {
			const res = await fetch(`/api/gallery/${toDelete.id}`, { method: 'DELETE' });
			if (!res.ok) throw await readError(res);
			images = images.filter((i) => i.id !== toDelete.id);
			notify('Foto dihapus');
		} catch (err) {
			notify(err.message || 'Gagal menghapus foto', 'error');
		} finally {
			deleting = false;
			toDelete = null;
		}
	}

	async function handleLogout() {
		try {
			await logout();
		} finally {
			goto('/');
		}
	}

	$: readyCount = queue.filter((q) => q.status === 'siap' || q.status === 'gagal').length;
</script>

<svelte:head>
	<title>Kelola Galeri - Amoebas Archery</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<svelte:window
	on:paste={onPaste}
	on:keydown={(e) => e.key === 'Escape' && !deleting && (toDelete = null)}
/>

{#if showToast}
	<div class="fixed top-20 right-4 z-[70] sm:right-8">
		<div
			class="flex max-w-sm items-center gap-3 rounded-full px-5 py-3 text-sm font-semibold text-white shadow-xl {toastType ===
			'success'
				? 'bg-azure'
				: 'bg-red-600'}"
		>
			<span class="h-2 w-2 shrink-0 rounded-full {toastType === 'success' ? 'bg-sun' : 'bg-white'}"
			></span>
			{toastMsg}
		</div>
	</div>
{/if}

<div class="min-h-screen bg-paper">
	<!-- Header -->
	<header class="border-b border-ink/10 bg-white">
		<div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-8">
			<a href="/" class="group flex items-center gap-3">
				<span
					class="grid h-10 w-10 place-items-center rounded-full bg-azure text-white transition-transform duration-500 group-hover:rotate-90"
				>
					<svg
						class="h-5 w-5"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle
							cx="12"
							cy="12"
							r="1.5"
							fill="currentColor"
						/>
					</svg>
				</span>
				<span class="leading-none font-semibold tracking-tight">
					<span class="block">Amoebas</span>
					<span class="block text-[10px] tracking-[0.3em] text-ink/50 uppercase">Admin</span>
				</span>
			</a>
			<div class="flex items-center gap-2">
				<a
					href="/#gallery"
					class="hidden rounded-full px-4 py-2.5 text-sm font-medium text-ink/70 transition-colors hover:bg-sky sm:block"
					>Lihat Situs</a
				>
				<span class="hidden text-sm text-ink/50 md:block">{data.admin}</span>
				<button
					on:click={handleLogout}
					class="rounded-full bg-paper px-4 py-2.5 text-sm font-semibold text-red-600 ring-1 ring-red-200 transition-colors hover:bg-red-50"
				>
					Logout
				</button>
			</div>
		</div>
	</header>

	<main class="mx-auto max-w-6xl px-4 py-10 sm:px-8 sm:py-14">
		<p class="eyebrow mb-4 text-ink/70">Kelola Galeri</p>
		<h1 class="display mb-10 text-5xl sm:text-7xl">Upload <span class="text-azure">foto</span></h1>

		<!-- Dropzone -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			on:dragover|preventDefault={() => (dragging = true)}
			on:dragleave={() => (dragging = false)}
			on:drop={onDrop}
			class="rounded-[2rem] border-2 border-dashed bg-white p-8 text-center transition-colors duration-300 sm:p-14 {dragging
				? 'border-azure bg-sky/60'
				: 'border-ink/15'}"
		>
			<div class="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-azure text-white">
				<svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M12 16V4m0 0l-4 4m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
				</svg>
			</div>
			<h2 class="text-2xl font-semibold tracking-tight sm:text-3xl">
				{dragging ? 'Lepaskan untuk menambahkan' : 'Tarik foto ke sini'}
			</h2>
			<p class="mx-auto mt-2 max-w-md text-sm text-ink/55">
				atau tempel (Ctrl/Cmd + V) dari clipboard. JPG, PNG, GIF, WEBP, AVIF — maksimal 5MB per
				foto, bisa banyak sekaligus.
			</p>
			<button
				on:click={() => fileInput.click()}
				class="btn-pill mt-7 bg-sun text-ink hover:bg-sun-600">Pilih dari perangkat</button
			>
			<input
				bind:this={fileInput}
				type="file"
				multiple
				accept="image/jpeg,image/png,image/gif,image/webp,image/avif"
				class="hidden"
				on:change={(e) => {
					addFiles(e.currentTarget.files);
					e.currentTarget.value = '';
				}}
			/>
		</div>

		<!-- Antrean -->
		{#if queue.length}
			<section class="mt-8">
				<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
					<h2 class="text-xl font-semibold tracking-tight">
						Antrean <span class="text-ink/40">({queue.length})</span>
					</h2>
					<button
						on:click={uploadAll}
						disabled={uploading || !readyCount}
						class="btn-pill bg-azure !pr-2.5 text-white hover:bg-ink disabled:opacity-50"
					>
						{uploading ? 'Mengupload…' : `Upload ${readyCount} foto`}
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

				<ul class="space-y-3">
					{#each queue as item (item.id)}
						<li class="flex items-center gap-4 rounded-[1.5rem] bg-white p-3 ring-1 ring-ink/5">
							<img
								src={item.url}
								alt={item.file.name}
								class="h-20 w-20 shrink-0 rounded-2xl object-cover"
							/>
							<div class="min-w-0 flex-1">
								<div class="flex items-center justify-between gap-3">
									<p class="truncate text-sm font-semibold">{item.file.name}</p>
									<span class="shrink-0 text-xs text-ink/50">{fmtSize(item.file.size)}</span>
								</div>
								{#if item.status === 'siap'}
									<input
										type="text"
										bind:value={item.title}
										placeholder="Judul (opsional)"
										class="mt-2 w-full rounded-xl bg-paper px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-azure"
									/>
								{:else if item.status === 'upload'}
									<div class="mt-3 h-2 overflow-hidden rounded-full bg-paper">
										<div
											class="h-2 rounded-full bg-azure transition-all duration-200"
											style="width: {item.progress}%"
										></div>
									</div>
									<p class="mt-1 text-xs text-ink/50">{item.progress}%</p>
								{:else if item.status === 'selesai'}
									<p class="mt-2 text-sm font-medium text-azure">✓ Selesai</p>
								{:else}
									<p class="mt-2 text-sm font-medium text-red-600">{item.error}</p>
								{/if}
							</div>
							{#if item.status !== 'upload' && item.status !== 'selesai'}
								<button
									on:click={() => removeFromQueue(item.id)}
									class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-paper transition-colors hover:bg-sky"
									aria-label="Hapus dari antrean"
								>
									<svg
										class="h-4 w-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										stroke-width="2"><path d="M6 18L18 6M6 6l12 12" /></svg
									>
								</button>
							{/if}
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		<!-- Galeri saat ini -->
		<section class="mt-14">
			<div class="mb-4 flex items-end justify-between">
				<h2 class="text-xl font-semibold tracking-tight">
					Foto di galeri <span class="text-ink/40">({images.length})</span>
				</h2>
			</div>

			{#if loadingImages}
				<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
					{#each Array(4) as _}
						<div class="aspect-square animate-pulse rounded-[1.5rem] bg-white"></div>
					{/each}
				</div>
			{:else if images.length === 0}
				<p class="rounded-[1.5rem] bg-white px-6 py-12 text-center text-ink/50">
					Belum ada foto. Upload yang pertama di atas.
				</p>
			{:else}
				<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
					{#each images as img (img.id)}
						<div class="group relative aspect-square overflow-hidden rounded-[1.5rem] bg-white">
							<img
								src={img.url}
								alt={img.title || img.name}
								class="h-full w-full object-cover"
								loading="lazy"
							/>
							{#if img.title}
								<p
									class="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-ink/70 to-transparent p-3 pt-8 text-xs font-medium text-white"
								>
									{img.title}
								</p>
							{/if}
							<button
								on:click={() => (toDelete = img)}
								class="absolute top-3 right-3 grid h-10 w-10 place-items-center rounded-full bg-white text-red-600 shadow-lg transition-transform hover:scale-110"
								aria-label="Hapus foto"
							>
								<svg
									class="h-4 w-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2"
									><path
										d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6M10 7V4h4v3"
									/></svg
								>
							</button>
						</div>
					{/each}
				</div>
			{/if}
		</section>
	</main>
</div>

<!-- Konfirmasi hapus -->
{#if toDelete}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-[60] flex items-center justify-center bg-ink/60 p-4 backdrop-blur-md"
		on:click={(e) => e.target === e.currentTarget && !deleting && (toDelete = null)}
	>
		<div class="w-full max-w-sm rounded-[2rem] bg-white p-8 text-center shadow-2xl">
			<img src={toDelete.url} alt="" class="mx-auto mb-5 h-24 w-24 rounded-2xl object-cover" />
			<h3 class="mb-2 text-2xl font-semibold tracking-tight">Hapus foto ini?</h3>
			<p class="mb-8 text-sm text-ink/60">Foto akan dihapus permanen dari galeri.</p>
			<div class="flex justify-center gap-3">
				<button
					class="btn-pill bg-paper text-ink hover:bg-sky disabled:opacity-50"
					on:click={() => (toDelete = null)}
					disabled={deleting}>Batal</button
				>
				<button
					class="btn-pill bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
					on:click={confirmDelete}
					disabled={deleting}
				>
					{deleting ? 'Menghapus…' : 'Hapus'}
				</button>
			</div>
		</div>
	</div>
{/if}
