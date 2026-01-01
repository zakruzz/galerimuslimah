<script setup>
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-6">
    <h1 class="text-2xl font-semibold text-[var(--text)]">Admin Dashboard</h1>
    <p class="mt-1 text-[var(--text-muted)]">Kelola produk, stok ukuran, dan gambar.</p>

    <div class="mt-6 grid sm:grid-cols-2 gap-4">
      <router-link
        to="/admin/products"
        class="rounded-2xl border p-5 hover:shadow-sm transition"
        :style="{ background:'var(--surface)', borderColor:'var(--border)', color:'var(--text)' }"
      >
        <div class="text-lg font-semibold">📦 Produk</div>
        <div class="text-sm text-[var(--text-muted)] mt-1">
          Tambah/edit produk, diskon, aktif/nonaktif, stok ukuran, dan gambar.
        </div>
      </router-link>
    </div>
  </div>
</template>
