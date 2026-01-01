<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'vue-router'

const router = useRouter()

const q = ref('')
const onlyActive = ref(false)
const loading = ref(true)
const rows = ref([])
const errMsg = ref('')

function rupiah(n){ return new Intl.NumberFormat('id-ID').format(n ?? 0) }

const filtered = computed(() => {
  const text = q.value.trim().toLowerCase()
  return (rows.value || []).filter(p => {
    const okText = !text || [p.name, p.code, p.type].some(x => (x||'').toLowerCase().includes(text))
    const okActive = !onlyActive.value || !!p.is_active
    return okText && okActive
  })
})

function setError(error){
  console.error(error)
  errMsg.value = error?.message || String(error) || 'Terjadi error.'
}

async function load() {
  errMsg.value = ''
  loading.value = true

  const { data, error } = await supabase
    .from('products')
    .select('id, code, name, type, price, discount_enabled, discount_percent, is_active, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    setError(error)
    rows.value = []
    loading.value = false
    return
  }

  rows.value = data ?? []
  loading.value = false
}

async function createBlank() {
  errMsg.value = ''
  const code = 'NEW-' + Math.random().toString(36).slice(2, 8).toUpperCase()

  const { data, error } = await supabase
    .from('products')
    .insert({
      code,
      name: 'Produk Baru',
      type: 'Baju',
      price: 0,
      discount_enabled: false,
      discount_percent: 0,
      is_active: false
    })
    .select('id')
    .single()

  if (error) return setError(error)

  router.push(`/admin/products/${data.id}`)
}

onMounted(load)
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-6">
    <div class="flex items-start justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold text-[var(--text)]">Produk</h1>
        <p class="text-sm text-[var(--text-muted)]">
          Kelola katalog baju + stok per ukuran.
          <span class="block mt-1">
            Catatan: upload gambar dilakukan di halaman <b>Edit</b> (maks 2 gambar, max 2MB per file).
          </span>
        </p>
      </div>

      <button
        class="px-4 py-3 rounded-2xl text-white font-medium"
        :style="{ background:'var(--primary)' }"
        @click="createBlank"
      >
        + Tambah Produk
      </button>
    </div>

    <div
      v-if="errMsg"
      class="mt-4 rounded-2xl border p-4"
      :style="{ background:'var(--surface)', borderColor:'var(--border)', color:'var(--text)' }"
    >
      <div class="font-semibold">Terjadi Error</div>
      <div class="text-sm mt-1" style="white-space: pre-wrap;">{{ errMsg }}</div>
      <div class="mt-3 flex gap-2">
        <button
          class="px-3 py-2 rounded-xl border text-sm"
          :style="{ borderColor:'var(--border)', color:'var(--text)' }"
          @click="load"
        >
          Coba lagi
        </button>
        <button
          class="px-3 py-2 rounded-xl border text-sm"
          :style="{ borderColor:'var(--border)', color:'var(--text)' }"
          @click="errMsg=''"
        >
          Tutup
        </button>
      </div>
    </div>

    <div class="mt-5 flex flex-wrap items-center gap-3">
      <input
        v-model="q"
        placeholder="Cari kode / nama / jenis..."
        class="w-full md:w-80 rounded-xl border px-4 py-3"
        :style="{ background:'var(--surface)', borderColor:'var(--border)', color:'var(--text)' }"
      />
      <label class="inline-flex items-center gap-2 text-sm text-[var(--text)]">
        <input type="checkbox" v-model="onlyActive" />
        hanya aktif
      </label>

      <button
        class="ml-auto px-3 py-2 rounded-xl border"
        :style="{ background:'var(--surface)', borderColor:'var(--border)', color:'var(--text)' }"
        @click="load"
      >
        Refresh
      </button>
    </div>

    <div v-if="loading" class="mt-6 text-[var(--text-muted)]">Loading...</div>

    <div
      v-else
      class="mt-4 rounded-2xl border overflow-hidden"
      :style="{ borderColor:'var(--border)', background:'var(--surface)' }"
    >
      <div
        class="grid grid-cols-12 gap-2 px-4 py-3 text-xs text-[var(--text-muted)] border-b"
        :style="{ borderColor:'var(--border)' }"
      >
        <div class="col-span-4">Nama</div>
        <div class="col-span-2">Kode</div>
        <div class="col-span-2">Jenis</div>
        <div class="col-span-2">Harga</div>
        <div class="col-span-1">Aktif</div>
        <div class="col-span-1 text-right">Aksi</div>
      </div>

      <div
        v-for="p in filtered"
        :key="p.id"
        class="grid grid-cols-12 gap-2 px-4 py-3 border-b items-center"
        :style="{ borderColor:'var(--border)' }"
      >
        <div class="col-span-4 font-medium text-[var(--text)] line-clamp-1">{{ p.name }}</div>
        <div class="col-span-2 text-sm text-[var(--text-muted)]">{{ p.code }}</div>
        <div class="col-span-2 text-sm text-[var(--text-muted)]">{{ p.type }}</div>
        <div class="col-span-2 text-sm text-[var(--text)]">Rp {{ rupiah(p.price) }}</div>
        <div class="col-span-1 text-sm">
          <span :style="{ color: p.is_active ? 'var(--success)' : 'var(--text-muted)' }">
            {{ p.is_active ? 'Ya' : 'Tidak' }}
          </span>
        </div>
        <div class="col-span-1 text-right">
          <router-link
            :to="`/admin/products/${p.id}`"
            class="px-3 py-2 rounded-xl border text-sm inline-flex justify-center"
            :style="{ background:'var(--surface-2)', borderColor:'var(--border)', color:'var(--text)' }"
          >
            Edit
          </router-link>
        </div>
      </div>

      <div v-if="filtered.length===0" class="px-4 py-6 text-sm text-[var(--text-muted)]">
        Tidak ada data yang cocok dengan filter.
      </div>
    </div>
  </div>
</template>
