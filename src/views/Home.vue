<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase'

const products = ref([])
const loading = ref(true)

function rupiah(n){ return new Intl.NumberFormat('id-ID').format(n) }
function finalPrice(p){
  if (!p.discount_enabled || p.discount_percent <= 0) return p.price
  return Math.round(p.price * (100 - p.discount_percent) / 100)
}

onMounted(async () => {
  loading.value = true
  const { data, error } = await supabase
    .from('products')
    .select(`
      id, code, name, type, price, discount_enabled, discount_percent, created_at,
      product_images(url, sort_order)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (!error) {
    products.value = (data ?? []).map(p => {
      const imgs = (p.product_images ?? []).sort((a,b)=>a.sort_order-b.sort_order)
      return { ...p, cover: imgs[0]?.url || 'https://via.placeholder.com/600x600' }
    })
  }
  loading.value = false
})
</script>

<template>
  <!-- PAGE HEADER -->
  <section class="flex items-end justify-between gap-4">
    <div>
      <h1 class="text-2xl md:text-3xl font-semibold text-[var(--text)] tracking-tight">
        Produk Terbaru
      </h1>
      <p class="mt-1 text-[var(--text-muted)]">
        Pilih ukuran, masukkan keranjang, checkout via WhatsApp.
      </p>
    </div>
  </section>

  <!-- LOADING -->
  <div v-if="loading" class="mt-6 text-[var(--text-muted)]">
    Loading...
  </div>

  <!-- PRODUCT GRID -->
  <div
    v-else
    class="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
  >
    <router-link
      v-for="p in products"
      :key="p.id"
      :to="`/product/${p.code}`"
      class="group rounded-2xl border overflow-hidden transition hover:shadow-md"
      :style="{ background:'var(--surface)', borderColor:'var(--border)' }"
    >
      <!-- IMAGE -->
      <div class="relative">
        <img
          :src="p.cover"
          class="aspect-square w-full object-cover"
        />

        <!-- DISCOUNT BADGE -->
        <div
          v-if="p.discount_enabled && p.discount_percent > 0"
          class="absolute top-3 left-3 rounded-full px-2 py-1 text-xs font-medium text-white"
          :style="{ background:'var(--primary)' }"
        >
          -{{ p.discount_percent }}%
        </div>
      </div>

      <!-- CONTENT -->
      <div class="p-3">
        <div class="text-xs text-[var(--text-muted)]">
          {{ p.type }}
        </div>

        <div class="mt-0.5 font-medium text-[var(--text)] line-clamp-1">
          {{ p.name }}
        </div>

        <div class="mt-2 font-semibold text-[var(--text)]">
          Rp {{ rupiah(finalPrice(p)) }}
        </div>

        <div
          class="mt-3 inline-flex items-center gap-2 text-sm transition"
          :style="{ color:'var(--text-muted)' }"
        >
          <span class="group-hover:underline" :style="{ color:'var(--primary)' }">
            Lihat detail
          </span>
          <i class="bi bi-arrow-right"></i>
        </div>
      </div>
    </router-link>
  </div>
</template>
