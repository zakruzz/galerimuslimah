<script setup>
import { computed } from 'vue'
import { useCartStore } from '../stores/cart'
import { useRouter } from 'vue-router'

const cart = useCartStore()
const router = useRouter()

function rupiah(n){ return new Intl.NumberFormat('id-ID').format(n) }

const hasItems = computed(() => cart.items.length > 0)

function goCheckout() {
  if (!hasItems.value) return
  router.push('/checkout')
}
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-8">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold">Keranjang</h1>
      <router-link to="/" class="px-3 py-2 rounded-xl border"
        :style="{ borderColor:'var(--border)', color:'var(--text)' }"
      >
        Tambah produk
      </router-link>
    </div>

    <div class="mt-4 grid lg:grid-cols-3 gap-4">
      <div class="lg:col-span-2 space-y-3">
        <div v-if="!hasItems" class="border rounded-2xl p-6 opacity-70"
          :style="{ borderColor:'var(--border)', background:'var(--surface)' }"
        >
          Keranjang masih kosong.
        </div>

        <div
          v-for="(i, idx) in cart.items"
          :key="i.productId + i.sizeName"
          class="border rounded-2xl p-4 flex gap-3"
          :style="{ borderColor:'var(--border)', background:'var(--surface)' }"
        >
          <img :src="i.imageUrl" class="w-20 h-20 rounded-xl object-cover border"
            :style="{ borderColor:'var(--border)' }"
          />
          <div class="flex-1">
            <div class="font-medium">{{ i.name }}</div>
            <div class="text-sm opacity-70">{{ i.type }} • Ukuran {{ i.sizeName }} • Kode {{ i.code }}</div>

            <div class="mt-2 flex items-center gap-3">
              <input
                type="number" min="1"
                v-model.number="i.qty"
                @change="cart.persist()"
                class="w-20 border rounded-xl px-3 py-2"
                :style="{ borderColor:'var(--border)', background:'var(--bg)', color:'var(--text)' }"
              />

              <div class="text-sm">Rp {{ rupiah(i.priceFinal) }}</div>

              <button class="ml-auto text-sm px-3 py-2 rounded-xl border"
                :style="{ borderColor:'var(--border)', color:'var(--text)' }"
                @click="cart.removeAt(idx)"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      </div>

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
          <b>Rp {{ rupiah(cart.totalPrice) }}</b>
        </div>

        <button
          class="mt-4 w-full px-4 py-3 rounded-2xl text-white disabled:opacity-50"
          :style="{ background:'var(--primary)' }"
          :disabled="!hasItems"
          @click="goCheckout"
        >
          Lanjut ke Checkout
        </button>

        <p class="mt-3 text-xs opacity-70">
          * Isi biodata pembeli di halaman checkout.
        </p>

        <button
          v-if="hasItems"
          class="mt-2 w-full px-4 py-3 rounded-2xl border"
          :style="{ borderColor:'var(--border)', color:'var(--text)' }"
          @click="cart.clear()"
        >
          Kosongkan keranjang
        </button>
      </div>
    </div>
  </div>
</template>
