<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { supabase } from '../../lib/supabase'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const id = String(route.params.id || '')

const BUCKET = 'product-images'
const MAX_MB = 2
const MAX_BYTES = MAX_MB * 1024 * 1024
const MAX_IMAGES = 2

const loading = ref(true)
const saving = ref(false)

const uploading = ref(false)
const uploadWarn = ref('')

const product = ref({
  id,
  code: '',
  name: '',
  type: '',
  price: 0,
  discount_enabled: false,
  discount_percent: 0,
  is_active: false,
  description: ''
})

const sizes = ref([])
const variants = ref([])
const images = ref([])

const sliderIndex = ref(0)

const currentImage = computed(() => images.value[sliderIndex.value]?.url || '')
const canUploadMore = computed(() => (images.value?.length || 0) < MAX_IMAGES)

function setWarn(msg){ uploadWarn.value = msg || '' }

function nextSortOrder() {
  if (!images.value.length) return 1
  return Math.max(...images.value.map(i => i.sort_order ?? 0)) + 1
}

async function loadAll() {
  loading.value = true
  setWarn('')

  const { data: p, error: pe } = await supabase
    .from('products')
    .select('id, code, name, type, price, discount_enabled, discount_percent, is_active, description')
    .eq('id', id)
    .single()

  if (pe) console.error(pe)
  if (!p) {
    loading.value = false
    return router.push('/admin/products')
  }
  product.value = { ...product.value, ...p, description: p.description ?? '' }

  const { data: s, error: se } = await supabase
    .from('sizes')
    .select('id, name')
    .order('name', { ascending: true })
  if (se) console.error(se)
  sizes.value = s ?? []

  const { data: v, error: ve } = await supabase
    .from('product_variants')
    .select('size_id, stock, sizes(name)')
    .eq('product_id', id)
  if (ve) console.error(ve)
  variants.value = (v ?? []).map(x => ({
    size_id: x.size_id,
    size_name: x.sizes?.name,
    stock: x.stock ?? 0
  }))

  // coba select dengan path
  const { data: imgs, error: ie } = await supabase
    .from('product_images')
    .select('id, url, sort_order, path')
    .eq('product_id', id)
    .order('sort_order', { ascending: true })

  if (ie) {
    // fallback kalau kolom path belum ada
    const { data: imgs2, error: ie2 } = await supabase
      .from('product_images')
      .select('id, url, sort_order')
      .eq('product_id', id)
      .order('sort_order', { ascending: true })
    if (ie2) console.error(ie2)
    images.value = imgs2 ?? []
  } else {
    images.value = imgs ?? []
  }

  if (sliderIndex.value >= images.value.length) sliderIndex.value = 0
  loading.value = false
}

function ensureVariant(size) {
  const found = variants.value.find(v => v.size_id === size.id)
  if (!found) variants.value.push({ size_id: size.id, size_name: size.name, stock: 0 })
}

async function saveProduct() {
  saving.value = true
  const { error } = await supabase
    .from('products')
    .update({
      code: product.value.code,
      name: product.value.name,
      type: product.value.type,
      price: Number(product.value.price) || 0,
      discount_enabled: !!product.value.discount_enabled,
      discount_percent: Number(product.value.discount_percent) || 0,
      is_active: !!product.value.is_active,
      description: product.value.description ?? ''
    })
    .eq('id', id)

  saving.value = false
  if (error) return alert(error.message)
  alert('Produk tersimpan.')
}

async function saveVariants() {
  saving.value = true

  const payload = variants.value.map(v => ({
    product_id: id,
    size_id: v.size_id,
    stock: Number(v.stock) || 0
  }))

  const { error } = await supabase
    .from('product_variants')
    .upsert(payload, { onConflict: 'product_id,size_id' })

  saving.value = false
  if (error) return alert(error.message)
  alert('Stok ukuran tersimpan.')
}

async function onPickImages(ev) {
  const files = Array.from(ev.target.files || [])
  ev.target.value = ''
  setWarn('')

  if (!files.length) return

  const remainingSlots = Math.max(0, MAX_IMAGES - (images.value?.length || 0))
  if (remainingSlots <= 0) {
    setWarn(`⚠️ Maksimal ${MAX_IMAGES} gambar per produk. Hapus dulu jika ingin upload lagi.`)
    return
  }

  let selected = files.slice(0, remainingSlots)
  if (files.length > remainingSlots) {
    setWarn(`⚠️ Maksimal ${MAX_IMAGES} gambar. ${files.length - remainingSlots} file di-skip karena melebihi limit.`)
  }

  const tooBig = selected.filter(f => f.size > MAX_BYTES)
  selected = selected.filter(f => f.size <= MAX_BYTES)

  if (tooBig.length) {
    const msg = `⚠️ ${tooBig.length} file di-skip karena > ${MAX_MB}MB: ${tooBig.map(f => f.name).join(', ')}`
    setWarn(uploadWarn.value ? (uploadWarn.value + '\n' + msg) : msg)
  }

  if (!selected.length) return

  uploading.value = true
  try {
    for (const file of selected) await uploadOneImage(file)
    await loadAll()
    if (images.value.length) sliderIndex.value = 0
  } catch (e) {
    console.error(e)
    setWarn(`❌ Upload gagal: ${e?.message || String(e)}`)
  } finally {
    uploading.value = false
  }
}

async function uploadOneImage(file) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g,'') || 'jpg'
  const path = `${id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false })
  if (upErr) throw upErr

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  const url = data.publicUrl
  const sort_order = nextSortOrder()

  // insert dengan fallback kalau kolom path belum ada
  const { error: insErr } = await supabase
    .from('product_images')
    .insert({ product_id: id, url, path, sort_order })

  if (!insErr) return

  const m = (insErr.message || '').toLowerCase()
  const looksLikeMissingPath = m.includes('path') && (m.includes('column') || m.includes('does not exist'))
  if (!looksLikeMissingPath) throw insErr

  const { error: ins2 } = await supabase
    .from('product_images')
    .insert({ product_id: id, url, sort_order })

  if (ins2) throw ins2
}

async function removeImage(img) {
  if (!confirm('Hapus gambar ini?')) return

  const { error: delDbErr } = await supabase
    .from('product_images')
    .delete()
    .eq('id', img.id)

  if (delDbErr) return alert(delDbErr.message)

  if (img.path) {
    const { error: stErr } = await supabase.storage.from(BUCKET).remove([img.path])
    if (stErr) console.warn('storage remove error:', stErr.message)
  } else {
    console.warn('Kolom path tidak ada / tidak tersimpan. File storage tidak bisa dihapus otomatis.')
  }

  await loadAll()
}

function prevImg() {
  if (!images.value.length) return
  sliderIndex.value = (sliderIndex.value - 1 + images.value.length) % images.value.length
}
function nextImg() {
  if (!images.value.length) return
  sliderIndex.value = (sliderIndex.value + 1) % images.value.length
}

watch(() => images.value.length, () => {
  if (sliderIndex.value >= images.value.length) sliderIndex.value = 0
})

onMounted(loadAll)
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-6">
    <div class="flex items-center justify-between">
      <div>
        <router-link to="/admin/products" class="text-sm hover:underline" :style="{ color:'var(--text-muted)' }">
          ← Kembali
        </router-link>
        <h1 class="text-2xl font-semibold text-[var(--text)] mt-1">Edit Produk</h1>
      </div>

      <button
        class="px-4 py-3 rounded-2xl text-white font-medium disabled:opacity-60"
        :style="{ background:'var(--primary)' }"
        :disabled="saving || loading"
        @click="saveProduct"
      >
        {{ saving ? 'Menyimpan...' : 'Simpan Produk' }}
      </button>
    </div>

    <div v-if="loading" class="mt-6 text-[var(--text-muted)]">Loading...</div>

    <div v-else class="mt-6 grid lg:grid-cols-3 gap-4">
      <!-- Produk -->
      <div class="lg:col-span-2 rounded-2xl border p-5"
        :style="{ background:'var(--surface)', borderColor:'var(--border)' }"
      >
        <div class="grid md:grid-cols-2 gap-4">
          <div>
            <label class="text-sm text-[var(--text-muted)]">Nama</label>
            <input v-model="product.name" class="mt-1 w-full rounded-xl border px-4 py-3"
              :style="{ background:'var(--surface-2)', borderColor:'var(--border)', color:'var(--text)' }" />
          </div>

          <div>
            <label class="text-sm text-[var(--text-muted)]">Kode</label>
            <input v-model="product.code" class="mt-1 w-full rounded-xl border px-4 py-3"
              :style="{ background:'var(--surface-2)', borderColor:'var(--border)', color:'var(--text)' }" />
          </div>

          <div>
            <label class="text-sm text-[var(--text-muted)]">Jenis</label>
            <input v-model="product.type" class="mt-1 w-full rounded-xl border px-4 py-3"
              :style="{ background:'var(--surface-2)', borderColor:'var(--border)', color:'var(--text)' }" />
          </div>

          <div>
            <label class="text-sm text-[var(--text-muted)]">Harga</label>
            <input type="number" v-model.number="product.price" class="mt-1 w-full rounded-xl border px-4 py-3"
              :style="{ background:'var(--surface-2)', borderColor:'var(--border)', color:'var(--text)' }" />
          </div>
        </div>

        <div class="mt-4">
          <label class="text-sm text-[var(--text-muted)]">Deskripsi</label>
          <textarea
            v-model="product.description"
            rows="4"
            class="mt-1 w-full rounded-xl border px-4 py-3"
            :style="{ background:'var(--surface-2)', borderColor:'var(--border)', color:'var(--text)' }"
            placeholder="Tulis deskripsi produk..."
          />
        </div>

        <div class="mt-4 flex flex-wrap items-center gap-4">
          <label class="inline-flex items-center gap-2 text-sm text-[var(--text)]">
            <input type="checkbox" v-model="product.is_active" />
            Produk aktif
          </label>

          <label class="inline-flex items-center gap-2 text-sm text-[var(--text)]">
            <input type="checkbox" v-model="product.discount_enabled" />
            Diskon aktif
          </label>

          <div class="flex items-center gap-2">
            <span class="text-sm text-[var(--text-muted)]">Diskon %</span>
            <input type="number" v-model.number="product.discount_percent"
              class="w-24 rounded-xl border px-3 py-2"
              :style="{ background:'var(--surface-2)', borderColor:'var(--border)', color:'var(--text)' }" />
          </div>
        </div>
      </div>

      <!-- Gambar -->
      <div class="rounded-2xl border p-5"
        :style="{ background:'var(--surface)', borderColor:'var(--border)' }"
      >
        <div class="flex items-center justify-between">
          <div class="font-semibold text-[var(--text)]">Gambar Produk</div>
          <div class="text-xs text-[var(--text-muted)]">
            Max {{ MAX_IMAGES }} gambar • Max {{ MAX_MB }}MB/file
          </div>
        </div>

        <div class="mt-3">
          <input
            type="file"
            accept="image/*"
            multiple
            class="block w-full text-sm"
            :disabled="uploading || !canUploadMore"
            @change="onPickImages"
          />

          <div v-if="!canUploadMore" class="mt-2 text-xs text-[var(--text-muted)]">
            Limit tercapai. Hapus salah satu gambar untuk upload lagi.
          </div>

          <div v-if="uploading" class="mt-2 text-sm text-[var(--text-muted)]">Uploading...</div>

          <div v-if="uploadWarn" class="mt-2 text-sm" style="white-space: pre-wrap; color: #f59e0b;">
            {{ uploadWarn }}
          </div>
        </div>

        <!-- Slider -->
        <div v-if="images.length" class="mt-4">
          <div class="relative rounded-2xl overflow-hidden border"
            :style="{ borderColor:'var(--border)', background:'var(--surface-2)' }"
          >
            <img :src="currentImage" class="w-full aspect-square object-cover" />
            <button
              class="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full border grid place-items-center"
              :style="{ background:'rgba(0,0,0,.35)', borderColor:'rgba(255,255,255,.25)', color:'white' }"
              @click="prevImg"
              type="button"
            >
              ‹
            </button>
            <button
              class="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full border grid place-items-center"
              :style="{ background:'rgba(0,0,0,.35)', borderColor:'rgba(255,255,255,.25)', color:'white' }"
              @click="nextImg"
              type="button"
            >
              ›
            </button>
          </div>

          <div class="mt-3 grid grid-cols-2 gap-2">
            <button
              v-for="(img, idx) in images"
              :key="img.id"
              type="button"
              class="rounded-xl border overflow-hidden text-left"
              :style="{ borderColor: idx===sliderIndex ? 'var(--primary)' : 'var(--border)', background:'var(--surface-2)' }"
              @click="sliderIndex = idx"
            >
              <div class="flex items-center gap-2 p-2">
                <img :src="img.url" class="w-14 h-14 rounded-lg object-cover border"
                  :style="{ borderColor:'var(--border)' }" />
                <div class="flex-1">
                  <div class="text-xs text-[var(--text-muted)]">Gambar {{ idx+1 }}</div>
                  <div class="text-xs text-[var(--text-muted)]">sort: {{ img.sort_order }}</div>
                </div>
                <button
                  type="button"
                  class="px-2 py-1 rounded-lg border text-xs"
                  :style="{ borderColor:'var(--border)', color:'var(--text)' }"
                  @click.stop="removeImage(img)"
                >
                  Hapus
                </button>
              </div>
            </button>
          </div>
        </div>

        <div v-else class="mt-4 text-sm text-[var(--text-muted)]">
          Belum ada gambar. Upload minimal 1 gambar agar tampil di katalog.
        </div>
      </div>

      <!-- Stok ukuran -->
      <div class="lg:col-span-3 rounded-2xl border p-5"
        :style="{ background:'var(--surface)', borderColor:'var(--border)' }"
      >
        <div class="flex items-center justify-between">
          <div>
            <div class="font-semibold text-[var(--text)]">Stok per Ukuran</div>
            <div class="text-sm text-[var(--text-muted)]">Isi stok untuk ukuran yang tersedia.</div>
          </div>
          <button class="px-4 py-3 rounded-2xl text-white font-medium"
            :style="{ background:'var(--primary)' }"
            @click="saveVariants"
            type="button"
          >
            Simpan Stok
          </button>
        </div>

        <div
          v-if="sizes.length===0"
          class="mt-4 rounded-2xl border p-4 text-sm"
          :style="{ borderColor:'var(--border)', background:'var(--surface-2)', color:'var(--text)' }"
        >
          <b>⚠️ Ukuran masih kosong.</b>
          <div class="mt-1 text-[var(--text-muted)]">
            Isi tabel <code>sizes</code> (mis. S, M, L, XL, XXL) supaya pilihan ukuran muncul.
          </div>
        </div>

        <div v-else class="mt-4 grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div v-for="s in sizes" :key="s.id" class="rounded-2xl border p-4"
            :style="{ background:'var(--surface-2)', borderColor:'var(--border)' }"
          >
            <div class="font-medium text-[var(--text)]">{{ s.name }}</div>

            <div class="mt-2">
              <input
                type="number"
                min="0"
                :value="variants.find(v=>v.size_id===s.id)?.stock ?? 0"
                @input="ensureVariant(s); variants.find(v=>v.size_id===s.id).stock = Number($event.target.value || 0)"
                class="w-full rounded-xl border px-3 py-2"
                :style="{ background:'var(--surface)', borderColor:'var(--border)', color:'var(--text)' }"
              />
            </div>

            <div class="mt-2 text-xs text-[var(--text-muted)]">
              Stok untuk size {{ s.name }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
