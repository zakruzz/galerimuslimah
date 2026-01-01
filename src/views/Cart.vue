<script setup>
import { computed, ref, onMounted } from 'vue'
import { useCartStore } from '../stores/cart'
import { supabase } from '../lib/supabase'
import { useRouter } from 'vue-router'

const cart = useCartStore()
const router = useRouter()

const profile = ref(null)
const loadingProfile = ref(true)

function rupiah(n){ return new Intl.NumberFormat('id-ID').format(n) }

const cartText = computed(() => {
  const lines = cart.items.map((i, idx) =>
    `${idx+1}. ${i.name} (${i.type})\n` +
    `   Kode: ${i.code}\n` +
    `   Ukuran: ${i.sizeName} | Qty: ${i.qty}\n` +
    `   Harga: Rp ${rupiah(i.priceFinal)} | Subtotal: Rp ${rupiah(i.priceFinal*i.qty)}`
  )
  return lines.join('\n\n')
})

function profileComplete(p){
  return p?.full_name && p?.phone && p?.address && p?.city && p?.postal_code
}

onMounted(async () => {
  loadingProfile.value = true
  const { data: sess } = await supabase.auth.getSession()
  if (!sess.session) {
    profile.value = null
    loadingProfile.value = false
    return
  }
  const uid = sess.session.user.id
  const { data } = await supabase.from('profiles').select('*').eq('user_id', uid).maybeSingle()
  profile.value = data
  loadingProfile.value = false
})

async function checkoutWA() {
  if (cart.items.length === 0) return alert('Keranjang kosong.')

  const { data: sess } = await supabase.auth.getSession()
  if (!sess.session) return router.push('/login')
  if (!profileComplete(profile.value)) return router.push('/account')

  const p = profile.value
  const total = cart.totalPrice

  const message =
`Halo, saya ingin order:

DATA PEMBELI
Nama: ${p.full_name}
No HP: ${p.phone}
Alamat: ${p.address}, ${p.city}, ${p.postal_code}

ITEM ORDER
${cartText.value}

TOTAL: Rp ${rupiah(total)}

Terima kasih.`

  const wa = import.meta.env.VITE_WA_NUMBER
  window.open(`https://wa.me/${wa}?text=${encodeURIComponent(message)}`, '_blank')
}
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-6">
    <!-- HEADER -->
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold text-[var(--text)]">Keranjang</h1>
      <router-link
        to="/"
        class="px-3 py-2 rounded-xl border transition"
        :style="{ background:'var(--surface)', borderColor:'var(--border)', color:'var(--text)' }"
      >
        Tambah produk
      </router-link>
    </div>

    <div class="mt-5 grid lg:grid-cols-3 gap-4">
      <!-- ITEMS -->
      <div class="lg:col-span-2 space-y-3">
        <!-- EMPTY -->
        <div
          v-if="cart.items.length === 0"
          class="rounded-2xl border p-6 text-[var(--text-muted)]"
          :style="{ background:'var(--surface)', borderColor:'var(--border)' }"
        >
          Keranjang masih kosong.
        </div>

        <!-- ITEM -->
        <div
          v-for="(i, idx) in cart.items"
          :key="i.productId + i.sizeName"
          class="rounded-2xl border p-4 flex gap-3"
          :style="{ background:'var(--surface)', borderColor:'var(--border)' }"
        >
          <img
            :src="i.imageUrl"
            class="w-20 h-20 rounded-xl object-cover border"
            :style="{ borderColor:'var(--border)' }"
          />

          <div class="flex-1">
            <div class="font-medium text-[var(--text)]">
              {{ i.name }}
            </div>
            <div class="text-sm text-[var(--text-muted)]">
              {{ i.type }} • Ukuran {{ i.sizeName }} • Kode {{ i.code }}
            </div>

            <div class="mt-2 flex items-center gap-3">
              <input
                type="number"
                min="1"
                v-model.number="i.qty"
                @change="cart.persist()"
                class="w-20 rounded-xl border px-3 py-2 outline-none"
                :style="{ background:'var(--surface)', borderColor:'var(--border)', color:'var(--text)' }"
              />

              <div class="text-sm text-[var(--text)]">
                Rp {{ rupiah(i.priceFinal) }}
              </div>

              <button
                class="ml-auto text-sm px-3 py-2 rounded-xl border transition"
                :style="{ background:'var(--surface)', borderColor:'var(--border)', color:'var(--text)' }"
                @click="cart.removeAt(idx)"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- SUMMARY -->
      <div
        class="rounded-2xl border p-5 h-fit"
        :style="{ background:'var(--surface-2)', borderColor:'var(--border)' }"
      >
        <div class="text-sm text-[var(--text-muted)]">Ringkasan</div>

        <div class="mt-2 flex justify-between text-[var(--text)]">
          <span>Item</span>
          <b>{{ cart.totalItems }}</b>
        </div>

        <div class="mt-1 flex justify-between text-[var(--text)]">
          <span>Total</span>
          <b>Rp {{ rupiah(cart.totalPrice) }}</b>
        </div>

        <button
          class="mt-4 w-full px-4 py-3 rounded-2xl text-white font-medium transition disabled:opacity-50"
          :style="{ background:'var(--primary)' }"
          :disabled="cart.items.length===0 || loadingProfile"
          @click="checkoutWA"
        >
          Checkout via WhatsApp
        </button>

        <p class="mt-3 text-xs text-[var(--text-muted)]">
          * Checkout wajib login dan data alamat lengkap.
        </p>

        <button
          v-if="cart.items.length > 0"
          class="mt-2 w-full px-4 py-3 rounded-2xl border transition"
          :style="{ background:'var(--surface)', borderColor:'var(--border)', color:'var(--text)' }"
          @click="cart.clear()"
        >
          Kosongkan keranjang
        </button>
      </div>
    </div>
  </div>
</template>
