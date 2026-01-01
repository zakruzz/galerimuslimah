<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import { useCartStore } from '../stores/cart'

const route = useRoute()
const router = useRouter()
const cart = useCartStore()

const code = route.params.code

const loading = ref(true)
const errorMsg = ref('')

const product = ref(null)
const images = ref([])
const variants = ref([])

const activeImage = ref(0)
const selectedSize = ref(null)
const qty = ref(1)

function rupiah(n) {
  return new Intl.NumberFormat('id-ID').format(n ?? 0)
}

/* =========================
   PRICE
========================= */
const priceFinal = computed(() => {
  if (!product.value) return 0
  if (!product.value.discount_enabled || product.value.discount_percent <= 0)
    return product.value.price

  return Math.round(
    product.value.price * (100 - product.value.discount_percent) / 100
  )
})

/* =========================
   SIZE & STOCK
========================= */
const availableSizes = computed(() =>
  variants.value.filter(v => v.stock > 0)
)

const maxQty = computed(() => selectedSize.value?.stock ?? 1)

const lowStock = computed(() => {
  if (!selectedSize.value) return false
  return selectedSize.value.stock <= 3
})

watch(selectedSize, () => {
  qty.value = 1
})

watch(qty, () => {
  if (qty.value < 1) qty.value = 1
  if (qty.value > maxQty.value) qty.value = maxQty.value
})

/* =========================
   IMAGE SLIDER
========================= */
function prevImg() {
  if (!images.value.length) return
  activeImage.value =
    (activeImage.value - 1 + images.value.length) % images.value.length
}

function nextImg() {
  if (!images.value.length) return
  activeImage.value =
    (activeImage.value + 1) % images.value.length
}

/* =========================
   CART
========================= */
function addToCart() {
  if (!selectedSize.value) {
    alert('Pilih ukuran terlebih dahulu.')
    return
  }

  cart.add({
    productId: product.value.id,
    code: product.value.code,
    name: product.value.name,
    type: product.value.type,
    imageUrl: images.value[0]?.url,
    sizeId: selectedSize.value.size_id,
    sizeName: selectedSize.value.size_name,
    priceFinal: priceFinal.value,
    qty: qty.value
  })

  router.push('/cart')
}

/* =========================
   LOAD DATA
========================= */
async function load() {
  loading.value = true
  errorMsg.value = ''

  // product
  const { data: p, error: pe } = await supabase
    .from('products')
    .select('id, code, name, type, price, discount_enabled, discount_percent, description')
    .eq('code', code)
    .eq('is_active', true)
    .maybeSingle()

  if (pe || !p) {
    errorMsg.value = 'Produk tidak ditemukan atau tidak aktif.'
    loading.value = false
    return
  }

  product.value = p

  // images (limit 2)
  const { data: imgs } = await supabase
    .from('product_images')
    .select('id, url, sort_order')
    .eq('product_id', p.id)
    .order('sort_order', { ascending: true })
    .limit(2)

  images.value =
    imgs && imgs.length
      ? imgs
      : [{ url: 'https://via.placeholder.com/600x600?text=No+Image' }]

  // variants + sizes
  const { data: vars } = await supabase
    .from('product_variants')
    .select('size_id, stock, sizes(name)')
    .eq('product_id', p.id)

  variants.value = (vars ?? []).map(v => ({
    size_id: v.size_id,
    size_name: v.sizes?.name,
    stock: v.stock ?? 0
  }))

  if (availableSizes.value.length) {
    selectedSize.value = availableSizes.value[0]
  }

  loading.value = false
}

onMounted(load)
</script>

<template>
  <div class="min-h-screen px-4 py-6 max-w-6xl mx-auto">
    <div v-if="loading" class="text-[var(--text-muted)]">Loading...</div>

    <div
      v-else-if="errorMsg"
      class="rounded-2xl border p-5"
      :style="{ background:'var(--surface)', borderColor:'var(--border)', color:'var(--text)' }"
    >
      {{ errorMsg }}
    </div>

    <div v-else class="grid lg:grid-cols-2 gap-6">
      <!-- IMAGE -->
      <div>
        <div
          class="relative rounded-2xl overflow-hidden border"
          :style="{ borderColor:'var(--border)', background:'var(--surface-2)' }"
        >
          <img
            :src="images[activeImage]?.url"
            class="w-full aspect-square object-cover"
          />

          <button
            v-if="images.length > 1"
            @click="prevImg"
            class="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full grid place-items-center"
            :style="{ background:'rgba(0,0,0,.45)', color:'white' }"
          >‹</button>

          <button
            v-if="images.length > 1"
            @click="nextImg"
            class="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full grid place-items-center"
            :style="{ background:'rgba(0,0,0,.45)', color:'white' }"
          >›</button>
        </div>

        <div v-if="images.length > 1" class="mt-3 grid grid-cols-2 gap-3">
          <button
            v-for="(img, i) in images"
            :key="i"
            @click="activeImage=i"
            class="rounded-xl overflow-hidden border"
            :style="{ borderColor: i===activeImage ? 'var(--primary)' : 'var(--border)' }"
          >
            <img :src="img.url" class="w-full aspect-square object-cover" />
          </button>
        </div>
      </div>

      <!-- INFO -->
      <div>
        <div class="text-sm text-[var(--text-muted)]">{{ product.type }}</div>
        <h1 class="text-2xl font-semibold text-[var(--text)]">
          {{ product.name }}
        </h1>

        <div class="mt-3">
          <div class="text-xl font-semibold text-[var(--text)]">
            Rp {{ rupiah(priceFinal) }}
          </div>
          <div
            v-if="product.discount_enabled"
            class="text-sm line-through text-[var(--text-muted)]"
          >
            Rp {{ rupiah(product.price) }}
          </div>
        </div>

        <p class="mt-4 text-sm text-[var(--text-muted)] whitespace-pre-wrap">
          {{ product.description || 'Tidak ada deskripsi.' }}
        </p>

        <!-- SIZE -->
        <div class="mt-6">
          <div class="text-sm font-medium text-[var(--text)]">Ukuran</div>

          <div class="mt-2 flex flex-wrap gap-2">
            <button
              v-for="s in availableSizes"
              :key="s.size_id"
              @click="selectedSize=s"
              class="px-4 py-2 rounded-xl border text-sm"
              :style="{
                borderColor: selectedSize?.size_id===s.size_id ? 'var(--primary)' : 'var(--border)',
                background: selectedSize?.size_id===s.size_id ? 'var(--primary)' : 'var(--surface)',
                color: selectedSize?.size_id===s.size_id ? 'white' : 'var(--text)'
              }"
            >
              {{ s.size_name }}
            </button>
          </div>

          <div v-if="!availableSizes.length" class="mt-2 text-sm text-red-500">
            Stok habis.
          </div>

          <div
            v-if="lowStock"
            class="mt-2 text-xs text-yellow-500"
          >
            ⚠️ Stok menipis ({{ selectedSize.stock }} tersisa)
          </div>
        </div>

        <!-- QTY -->
        <div class="mt-4 flex items-center gap-3">
          <input
            type="number"
            min="1"
            :max="maxQty"
            v-model.number="qty"
            class="w-20 rounded-xl border px-3 py-2"
            :style="{ background:'var(--surface)', borderColor:'var(--border)', color:'var(--text)' }"
          />
          <span class="text-sm text-[var(--text-muted)]">
            Maks {{ maxQty }}
          </span>
        </div>

        <!-- CTA -->
        <div class="mt-6 flex gap-3">
          <button
            class="flex-1 px-4 py-3 rounded-2xl text-white font-medium"
            :style="{ background:'var(--primary)' }"
            @click="addToCart"
            :disabled="!availableSizes.length"
          >
            Masukkan Keranjang
          </button>

          <router-link
            to="/cart"
            class="px-4 py-3 rounded-2xl border text-sm"
            :style="{ borderColor:'var(--border)', color:'var(--text)' }"
          >
            Lihat Keranjang
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
