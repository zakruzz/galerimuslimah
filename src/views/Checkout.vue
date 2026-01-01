<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCartStore } from '../stores/cart'
import { useRouter } from 'vue-router'
import { getCurrentInstance } from 'vue'

const { appContext } = getCurrentInstance()
const $swal = appContext.config.globalProperties.$swal

const cart = useCartStore()
const router = useRouter()

function rupiah(n){ return new Intl.NumberFormat('id-ID').format(n) }

const form = ref({
  full_name: '',
  phone: '',
  address: '',
  city: '',
  postal_code: '',
  note: '',
})

const STORAGE_KEY = 'checkout_profile_v1'

onMounted(() => {
  // load saved checkout profile
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) form.value = { ...form.value, ...JSON.parse(raw) }
  } catch {}
})

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(form.value))
}

const cartText = computed(() => {
  const lines = cart.items.map((i, idx) =>
    `${idx+1}. ${i.name} (${i.type})\n` +
    `   Kode: ${i.code}\n` +
    `   Ukuran: ${i.sizeName} | Qty: ${i.qty}\n` +
    `   Harga: Rp ${rupiah(i.priceFinal)} | Subtotal: Rp ${rupiah(i.priceFinal*i.qty)}`
  )
  return lines.join('\n\n')
})

const total = computed(() => cart.totalPrice)

function validate() {
  if (cart.items.length === 0) return 'Keranjang kosong.'
  if (!form.value.full_name.trim()) return 'Nama lengkap wajib diisi.'
  if (!form.value.phone.trim()) return 'No HP (WhatsApp) wajib diisi.'
  if (!form.value.address.trim()) return 'Alamat wajib diisi.'
  if (!form.value.city.trim()) return 'Kota wajib diisi.'
  if (!form.value.postal_code.trim()) return 'Kode pos wajib diisi.'
  return ''
}

async function checkoutWA() {
  const msg = validate()
  if (msg) {
    await $swal({ icon:'warning', title:'Data belum lengkap', text: msg })
    return
  }

  persist()

  const p = form.value
  const wa = import.meta.env.VITE_WA_NUMBER
  if (!wa) {
    await $swal({ icon:'error', title:'WA Number belum di-set', text:'Isi VITE_WA_NUMBER di .env' })
    return
  }

  const message =
`Halo, saya ingin order:

DATA PEMBELI
Nama: ${p.full_name}
No HP: ${p.phone}
Alamat: ${p.address}, ${p.city}, ${p.postal_code}
Catatan: ${p.note || '-'}

ITEM ORDER
${cartText.value}

TOTAL: Rp ${rupiah(total.value)}

Terima kasih.`

  const url = `https://wa.me/${wa}?text=${encodeURIComponent(message)}`
  window.open(url, '_blank')
}

function backToCart() {
  router.push('/cart')
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <div class="flex items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold">Checkout</h1>
        <p class="text-sm opacity-70">Isi biodata pembeli, lalu checkout via WhatsApp.</p>
      </div>

      <button class="px-3 py-2 rounded-xl border"
        :style="{ borderColor:'var(--border)', color:'var(--text)' }"
        @click="backToCart"
      >
        ← Kembali
      </button>
    </div>

    <div class="mt-5 grid lg:grid-cols-3 gap-4">
      <!-- Form -->
      <div class="lg:col-span-2 border rounded-2xl p-5"
        :style="{ borderColor:'var(--border)', background:'var(--surface)' }"
      >
        <div class="grid sm:grid-cols-2 gap-3">
          <div>
            <div class="text-sm mb-1 opacity-80">Nama lengkap</div>
            <input v-model="form.full_name" @input="persist"
              class="w-full rounded-xl px-4 py-3 border"
              :style="{ borderColor:'var(--border)', background:'var(--bg)', color:'var(--text)' }"
              placeholder="Contoh: Yuliati Ratna"
            />
          </div>

          <div>
            <div class="text-sm mb-1 opacity-80">No HP (WhatsApp)</div>
            <input v-model="form.phone" @input="persist"
              class="w-full rounded-xl px-4 py-3 border"
              :style="{ borderColor:'var(--border)', background:'var(--bg)', color:'var(--text)' }"
              placeholder="Contoh: 08xxxxxxxxxx"
            />
          </div>

          <div class="sm:col-span-2">
            <div class="text-sm mb-1 opacity-80">Alamat lengkap</div>
            <textarea v-model="form.address" @input="persist"
              class="w-full rounded-xl px-4 py-3 border min-h-[110px]"
              :style="{ borderColor:'var(--border)', background:'var(--bg)', color:'var(--text)' }"
              placeholder="Jalan, nomor rumah, RT/RW, kelurahan, kecamatan"
            />
          </div>

          <div>
            <div class="text-sm mb-1 opacity-80">Kota</div>
            <input v-model="form.city" @input="persist"
              class="w-full rounded-xl px-4 py-3 border"
              :style="{ borderColor:'var(--border)', background:'var(--bg)', color:'var(--text)' }"
              placeholder="Contoh: Surabaya"
            />
          </div>

          <div>
            <div class="text-sm mb-1 opacity-80">Kode pos</div>
            <input v-model="form.postal_code" @input="persist"
              class="w-full rounded-xl px-4 py-3 border"
              :style="{ borderColor:'var(--border)', background:'var(--bg)', color:'var(--text)' }"
              placeholder="Contoh: 60111"
            />
          </div>

          <div class="sm:col-span-2">
            <div class="text-sm mb-1 opacity-80">Catatan (opsional)</div>
            <input v-model="form.note" @input="persist"
              class="w-full rounded-xl px-4 py-3 border"
              :style="{ borderColor:'var(--border)', background:'var(--bg)', color:'var(--text)' }"
              placeholder="Contoh: warna hitam, kirim sore, dll."
            />
          </div>
        </div>
      </div>

      <!-- Ringkasan -->
      <div class="border rounded-2xl p-5 h-fit"
        :style="{ borderColor:'var(--border)', background:'var(--surface)' }"
      >
        <div class="opacity-70 text-sm">Ringkasan</div>

        <div class="mt-2 flex justify-between">
          <span>Item</span>
          <b>{{ cart.totalItems }}</b>
        </div>

        <div class="mt-1 flex justify-between">
          <span>Total</span>
          <b>Rp {{ rupiah(total) }}</b>
        </div>

        <button
          class="mt-4 w-full px-4 py-3 rounded-2xl text-white"
          :style="{ background:'var(--primary)' }"
          @click="checkoutWA"
        >
          Checkout via WhatsApp
        </button>

        <button
          class="mt-2 w-full px-4 py-3 rounded-2xl border"
          :style="{ borderColor:'var(--border)', color:'var(--text)' }"
          @click="cart.clear()"
        >
          Kosongkan keranjang
        </button>

        <p class="mt-3 text-xs opacity-70">
          * Setelah WA terbuka, kamu bisa lanjut diskusi pembayaran/pengiriman.
        </p>
      </div>
    </div>
  </div>
</template>
