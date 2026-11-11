<script>
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { isAdmin } from '$lib/auth';
	import { reveal } from '$lib/actions/reveal';

	// UI state
	let images = []; // { id, name, url, title, description, created_at }
	let isLoading = true;

	// Admin & subscription
	let adminStatus = false;
	let unsubscribeAdmin;

	// Upload modal state
	let showUploadModal = false;
	let newImage = { title: '', description: '', file: null };
	let uploadProgress = 0;
	let uploadError = '';

	// Delete modal state
	let showDeleteModal = false;
	let imageToDelete = null;
	let deleting = false;

	// Delete ALL modal state
	let showDeleteAllModal = false;
	let deletingAll = false;

	// Toast notification
	let toastMsg = '';
	let toastType = 'success'; // 'success' | 'error'
	let showToast = false;
	const showNotification = (msg, type = 'success', ms = 2500) => {
		toastMsg = msg;
		toastType = type;
		showToast = true;
		setTimeout(() => (showToast = false), ms);
	};

	/** @param {Response} res */
	async function readError(res) {
		const data = await res.json().catch(() => null);
		return new Error(data?.message || `Request gagal (${res.status})`);
	}

	// ---------- Fetch images ----------
	async function fetchImages() {
		isLoading = true;
		try {
			const res = await fetch('/api/gallery');
			if (!res.ok) throw await readError(res);
			images = (await res.json()).images;
		} catch (err) {
			console.error('Failed fetching images:', err);
			images = [];
			showNotification('Gagal memuat galeri', 'error');
		} finally {
			isLoading = false;
		}
	}

	// ---------- File selection ----------
	const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];

	function handleFileSelect(e) {
		uploadError = '';
		const file = e.target.files?.[0] ?? null;
		if (!file) {
			newImage.file = null;
			return;
		}
		if (!ALLOWED_TYPES.includes(file.type)) {
			uploadError = 'Format harus JPG, PNG, GIF, WEBP, atau AVIF';
			newImage.file = null;
			return;
		}
		if (file.size > 5 * 1024 * 1024) {
			uploadError = 'Ukuran file maksimal 5MB';
			newImage.file = null;
			return;
		}
		newImage.file = file;
	}

	// ---------- Upload image ----------
	async function uploadImage() {
		if (!newImage.file) {
			uploadError = 'Pilih file gambar terlebih dahulu';
			return;
		}

		uploadError = '';
		uploadProgress = 20;

		try {
			const form = new FormData();
			form.append('file', newImage.file);
			if (newImage.title) form.append('title', newImage.title);
			if (newImage.description) form.append('description', newImage.description);

			uploadProgress = 50;
			const res = await fetch('/api/gallery', { method: 'POST', body: form });
			if (!res.ok) throw await readError(res);
			const { image } = await res.json();

			uploadProgress = 100;
			images = [image, ...images];
			showNotification('Upload berhasil 🎉', 'success');
			newImage = { title: '', description: '', file: null };
			showUploadModal = false;
		} catch (err) {
			console.error('Upload failed:', err);
			uploadError = err.message || 'Terjadi kesalahan saat upload';
			showNotification('Upload gagal 😢', 'error');
		} finally {
			setTimeout(() => (uploadProgress = 0), 500);
		}
	}

	function cancelUpload() {
		newImage = { title: '', description: '', file: null };
		showUploadModal = false;
		uploadError = '';
		uploadProgress = 0;
	}

	// ---------- Delete one ----------
	function confirmDelete(image) {
		imageToDelete = image;
		showDeleteModal = true;
	}

	async function deleteImage() {
		if (!imageToDelete) return;
		deleting = true;
		try {
			const res = await fetch(`/api/gallery/${imageToDelete.id}`, { method: 'DELETE' });
			if (!res.ok) throw await readError(res);
			images = images.filter((img) => img.id !== imageToDelete.id);
			showNotification('Foto berhasil dihapus', 'success');
		} catch (err) {
			console.error('Failed to delete image:', err);
			showNotification('Gagal menghapus foto', 'error');
		} finally {
			deleting = false;
			showDeleteModal = false;
			imageToDelete = null;
		}
	}

	function cancelDelete() {
		showDeleteModal = false;
		imageToDelete = null;
	}

	// ---------- Delete all ----------
	function confirmDeleteAll() {
		showDeleteAllModal = true;
	}

	async function deleteAllImages() {
		if (images.length === 0) return;
		deletingAll = true;
		try {
			const res = await fetch('/api/gallery', { method: 'DELETE' });
			if (!res.ok) throw await readError(res);
			images = [];
			showNotification('Semua foto berhasil dihapus', 'success');
		} catch (err) {
			console.error('Failed to delete all images:', err);
			showNotification('Gagal menghapus semua foto', 'error');
		} finally {
			deletingAll = false;
			showDeleteAllModal = false;
		}
	}

	function cancelDeleteAll() {
		showDeleteAllModal = false;
	}

	// Handle escape key
	function handleKeydown(event) {
		if (event.key === 'Escape') {
			if (showUploadModal) cancelUpload();
			if (showDeleteModal) cancelDelete();
			if (showDeleteAllModal) cancelDeleteAll();
		}
	}

	// Handle click outside modal
	function handleBackdropClick(event) {
		if (event.target === event.currentTarget) {
			if (showUploadModal) cancelUpload();
			if (showDeleteModal) cancelDelete();
			if (showDeleteAllModal) cancelDeleteAll();
		}
	}

	// ---------- lifecycle ----------
	onMount(async () => {
		if (browser) {
			unsubscribeAdmin = isAdmin.subscribe((v) => (adminStatus = !!v));
			window.addEventListener('keydown', handleKeydown);
			await fetchImages();
		}
	});

	onDestroy(() => {
		if (browser) {
			if (unsubscribeAdmin) unsubscribeAdmin();
			window.removeEventListener('keydown', handleKeydown);
		}
	});
</script>

<!-- TOAST -->
{#if showToast}
	<div class="animate-fadeInScale fixed top-24 right-6 z-[60]">
		<div
			class="flex items-center gap-3 rounded-full px-5 py-3 text-sm font-semibold shadow-xl {toastType ===
			'success'
				? 'bg-azure text-white'
				: 'bg-red-600 text-white'}"
		>
			<span class="h-2 w-2 rounded-full {toastType === 'success' ? 'bg-sun' : 'bg-white'}"></span>
			{toastMsg}
		</div>
	</div>
{/if}

<section id="gallery" class="relative bg-white py-24 sm:py-36">
	<div class="mx-auto max-w-[1600px] px-4 sm:px-8">
		<!-- Header -->
		<div class="mb-14 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
			<div use:reveal>
				<p class="eyebrow mb-6 text-ink/70">Galeri Kegiatan</p>
				<h2 class="display text-6xl text-ink sm:text-8xl">
					Momen<br /><span class="text-azure">berkesan</span>
				</h2>
			</div>
			<div class="flex flex-col gap-6 lg:items-end" use:reveal={{ delay: 100 }}>
				<p class="max-w-md text-lg leading-relaxed text-ink/65 lg:text-right">
					Potret momen berkuda &amp; memanah bersama Amoebas Archery.
				</p>

				{#if adminStatus}
					<div class="flex flex-wrap gap-3">
						<button
							class="btn-pill bg-sun !pr-2.5 text-ink hover:bg-sun-600"
							on:click={() => (showUploadModal = true)}
						>
							Upload Foto Baru
							<span class="btn-icon bg-ink text-white">
								<svg
									class="h-3.5 w-3.5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									stroke-width="2.5"><path d="M12 5v14M5 12h14" /></svg
								>
							</span>
						</button>
						{#if images.length > 0}
							<button
								class="btn-pill bg-white text-red-600 ring-1 ring-red-200 hover:bg-red-50"
								on:click={confirmDeleteAll}
							>
								Hapus Semua
							</button>
						{/if}
					</div>
				{/if}
			</div>
		</div>

		{#if isLoading}
			<div class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
				{#each Array(8) as _, i}
					<div
						class="animate-pulse rounded-[1.5rem] bg-paper {i % 3 === 0 ? 'h-80' : 'h-56'}"
					></div>
				{/each}
			</div>
		{:else if images.length === 0}
			<div class="rounded-[2rem] bg-paper px-6 py-24 text-center" use:reveal>
				<div
					class="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full bg-azure text-white"
				>
					<svg
						class="h-9 w-9"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"
					>
						<rect x="3" y="5" width="18" height="14" rx="2"></rect>
						<circle cx="9" cy="10" r="1.5" />
						<path d="M21 16l-5-5-9 8" />
					</svg>
				</div>
				<h3 class="mb-3 text-3xl font-semibold tracking-tight">Belum ada foto di galeri</h3>
				<p class="mx-auto max-w-md text-lg text-ink/60">
					Nanti akan muncul momen-momen seru di sini — sabar ya! 😊
				</p>
			</div>
		{:else}
			<!-- Masonry -->
			<div class="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
				{#each images as img, i (img.id)}
					<div
						use:reveal={{ delay: (i % 4) * 80 }}
						class="group relative mb-4 break-inside-avoid overflow-hidden rounded-[1.5rem] bg-paper"
						data-cursor
					>
						<img
							src={img.url}
							alt={img.title || img.description || `Foto kegiatan Amoebas Archery ${i + 1}`}
							class="w-full object-cover transition-transform duration-[1200ms] ease-out-expo group-hover:scale-105"
							loading="lazy"
						/>
						<div
							class="pointer-events-none absolute inset-0 bg-gradient-to-t from-azure/50 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
						></div>

						{#if adminStatus}
							<button
								class="absolute top-3 right-3 grid h-10 w-10 place-items-center rounded-full bg-white text-red-600 shadow-lg transition-transform hover:scale-110"
								on:click={() => confirmDelete(img)}
								title="Hapus gambar"
								aria-label="Hapus gambar"
							>
								<svg
									class="h-4 w-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2"
								>
									<path
										d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6M10 7V4h4v3"
									/>
								</svg>
							</button>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Upload Modal -->
	{#if showUploadModal}
		<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
		<div
			class="fixed inset-0 z-[60] flex items-center justify-center bg-ink/60 p-4 backdrop-blur-md"
			on:click={handleBackdropClick}
		>
			<div class="animate-fadeInScale w-full max-w-md rounded-[2rem] bg-white p-8 shadow-2xl">
				<div class="mb-6 flex items-center justify-between">
					<h3 class="text-2xl font-semibold tracking-tight">Upload Foto Baru</h3>
					<button
						class="grid h-10 w-10 place-items-center rounded-full bg-paper transition-colors hover:bg-sky"
						on:click={cancelUpload}
						aria-label="Tutup"
					>
						<svg
							class="h-5 w-5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							stroke-width="2"><path d="M6 18L18 6M6 6l12 12" /></svg
						>
					</button>
				</div>

				<div class="space-y-4">
					<label class="block">
						<span class="mb-2 block text-sm font-medium text-ink/70">Judul (opsional)</span>
						<input type="text" bind:value={newImage.title} class="field" placeholder="Judul foto" />
					</label>

					<label class="block">
						<span class="mb-2 block text-sm font-medium text-ink/70">Deskripsi (opsional)</span>
						<textarea
							bind:value={newImage.description}
							rows="2"
							class="field resize-none"
							placeholder="Deskripsi singkat"
						></textarea>
					</label>

					<label class="block">
						<span class="mb-2 block text-sm font-medium text-ink/70">Pilih Foto</span>
						<input
							type="file"
							accept="image/jpeg,image/png,image/gif,image/webp,image/avif"
							on:change={handleFileSelect}
							class="field file:mr-4 file:rounded-full file:border-0 file:bg-sun file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-ink"
						/>
						<span class="mt-1 block text-xs text-ink/50"
							>Format: JPG/PNG/GIF/WEBP/AVIF — maksimal 5MB</span
						>
					</label>

					{#if newImage.file}
						<p class="rounded-xl bg-sky px-3 py-2 text-xs font-medium text-azure">
							✓ File terpilih: {newImage.file.name}
						</p>
					{/if}

					{#if uploadError}
						<p class="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
							{uploadError}
						</p>
					{/if}

					{#if uploadProgress > 0}
						<div class="space-y-2">
							<div class="h-2 w-full overflow-hidden rounded-full bg-paper">
								<div
									class="h-2 rounded-full bg-azure transition-all duration-300"
									style={`width: ${uploadProgress}%`}
								></div>
							</div>
							<p class="text-center text-xs font-medium text-ink/50">Upload: {uploadProgress}%</p>
						</div>
					{/if}
				</div>

				<div class="mt-8 flex justify-end gap-3">
					<button
						class="btn-pill bg-paper text-ink hover:bg-sky disabled:opacity-50"
						on:click={cancelUpload}
						disabled={uploadProgress > 0 && uploadProgress < 100}
					>
						Batal
					</button>
					<button
						class="btn-pill bg-azure text-white hover:bg-ink disabled:opacity-50"
						on:click={uploadImage}
						disabled={!newImage.file || (uploadProgress > 0 && uploadProgress < 100)}
					>
						{uploadProgress > 0 ? 'Mengupload...' : 'Upload'}
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Delete One Modal -->
	{#if showDeleteModal}
		<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
		<div
			class="fixed inset-0 z-[60] flex items-center justify-center bg-ink/60 p-4 backdrop-blur-md"
			on:click={handleBackdropClick}
		>
			<div
				class="animate-fadeInScale w-full max-w-sm rounded-[2rem] bg-white p-8 text-center shadow-2xl"
			>
				<div
					class="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-red-50 text-red-600"
				>
					<svg
						class="h-7 w-7"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						stroke-width="2"
						><path
							d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6M10 7V4h4v3"
						/></svg
					>
				</div>
				<h3 class="mb-2 text-2xl font-semibold tracking-tight">Hapus gambar?</h3>
				<p class="mb-8 text-sm text-ink/60">Gambar ini akan dihapus permanen dari storage.</p>
				<div class="flex justify-center gap-3">
					<button
						class="btn-pill bg-paper text-ink hover:bg-sky disabled:opacity-50"
						on:click={cancelDelete}
						disabled={deleting}>Batal</button
					>
					<button
						class="btn-pill bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
						on:click={deleteImage}
						disabled={deleting}
					>
						{deleting ? 'Menghapus...' : 'Hapus'}
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Delete ALL Modal -->
	{#if showDeleteAllModal}
		<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
		<div
			class="fixed inset-0 z-[60] flex items-center justify-center bg-ink/60 p-4 backdrop-blur-md"
			on:click={handleBackdropClick}
		>
			<div
				class="animate-fadeInScale w-full max-w-sm rounded-[2rem] bg-white p-8 text-center shadow-2xl"
			>
				<div
					class="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-red-50 text-red-600"
				>
					<svg
						class="h-7 w-7"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						stroke-width="2"
						><path
							d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6M10 7V4h4v3"
						/></svg
					>
				</div>
				<h3 class="mb-2 text-2xl font-semibold tracking-tight">Hapus semua gambar?</h3>
				<p class="mb-8 text-sm text-ink/60">Semua gambar akan dihapus permanen dari storage.</p>
				<div class="flex justify-center gap-3">
					<button
						class="btn-pill bg-paper text-ink hover:bg-sky disabled:opacity-50"
						on:click={cancelDeleteAll}
						disabled={deletingAll}>Batal</button
					>
					<button
						class="btn-pill bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
						on:click={deleteAllImages}
						disabled={deletingAll}
					>
						{deletingAll ? 'Menghapus...' : 'Hapus Semua'}
					</button>
				</div>
			</div>
		</div>
	{/if}
</section>

<style>
	@keyframes fadeInScale {
		from {
			opacity: 0;
			transform: scale(0.95);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}
	.animate-fadeInScale {
		animation: fadeInScale 0.4s cubic-bezier(0.16, 1, 0.3, 1);
	}
	.field {
		width: 100%;
		border-radius: 1rem;
		background: var(--color-paper);
		padding: 0.75rem 1rem;
		font-size: 0.875rem;
		color: var(--color-ink);
		outline: none;
		border: 1px solid transparent;
		transition:
			border-color 0.2s,
			background 0.2s;
	}
	.field:focus {
		border-color: var(--color-azure);
		background: #fff;
	}
</style>
