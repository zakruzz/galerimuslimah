<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from './lib/supabase'
import { useCartStore } from './stores/cart'
import { useThemeStore } from './stores/theme'
import { getCurrentInstance } from 'vue'

const { appContext } = getCurrentInstance()
const $swal = appContext.config.globalProperties.$swal

const cart = useCartStore()
const theme = useThemeStore()
const router = useRouter()
const route = useRoute()

const displayName = ref('Akun')
const showAccountMenu = ref(false)

const isAdmin = ref(false)

async function refreshUserLabel() {
  const { data } = await supabase.auth.getSession()
  const session = data.session

  if (!session) {
    displayName.value = 'Akun'
    isAdmin.value = false
    return null
  }

  const uid = session.user.id
  const { data: prof, error } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('user_id', uid)
    .maybeSingle()

  if (error) console.error('profiles select error:', error)

  displayName.value = prof?.full_name?.trim() || session.user.email || 'Akun'
  isAdmin.value = prof?.role === 'admin'
  return session
}

async function logout() {
  showAccountMenu.value = false

  const { error } = await supabase.auth.signOut()
  if (error) {
    await $swal.fire({
      icon: 'error',
      title: 'Logout gagal',
      text: error.message,
      confirmButtonText: 'OK',
    })
    return
  }

  await $swal.fire({
    icon: 'success',
    title: 'Logout berhasil',
    text: 'Anda akan diarahkan ke halaman login',
    confirmButtonText: 'OK',
    allowOutsideClick: false,
  })

  window.location.href = '/login'
}


watch(() => route.fullPath, () => {
  showAccountMenu.value = false
})


let sub

onMounted(() => {
  const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
    if (!session && route.path !== '/login' && route.path !== '/register') {
      await router.replace('/login')
    }
    await refreshUserLabel()
  })
  sub = data.subscription
})

onBeforeUnmount(() => sub?.unsubscribe())

</script>


<template>
  <div class="min-h-screen">
    <!-- NAVBAR -->
    <header
      class="sticky top-0 z-50 border-b backdrop-blur"
      :style="{ background:'var(--surface)', borderColor:'var(--border)' }"
    >
      <div class="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        <router-link to="/" class="flex items-center gap-2 font-semibold text-lg">
          <span
            class="h-9 w-9 rounded-2xl grid place-items-center text-white"
            :style="{ background:'var(--primary)' }"
          >
            <i class="bi bi-bag-heart-fill"></i>
          </span>
          <span :style="{ color:'var(--primary)' }">Katalog Baju</span>
        </router-link>

        <div class="flex items-center gap-2">
          <!-- Dark mode -->
          <button
            @click="theme.toggle()"
            class="rounded-xl border px-3 py-2"
            :style="{ background:'var(--surface)', borderColor:'var(--border)' }"
          >
            <i :class="theme.dark ? 'bi bi-sun' : 'bi bi-moon-stars'"></i>
          </button>

          <!-- Cart -->
          <router-link
            to="/cart"
            class="relative rounded-xl border px-3 py-2 flex items-center gap-2"
            :style="{ background:'var(--surface)', borderColor:'var(--border)' }"
          >
            <i class="bi bi-cart3"></i>
            <span class="hidden sm:inline">Keranjang</span>
            <span
              v-if="cart.totalItems"
              class="absolute -top-2 -right-2 text-xs px-2 h-6 rounded-full grid place-items-center text-white"
              :style="{ background:'var(--primary)' }"
            >
              {{ cart.totalItems }}
            </span>
          </router-link>

          <router-link
  v-if="isAdmin"
  to="/admin"
  class="px-3 py-2 rounded-xl border text-sm"
  :style="{ background:'var(--surface)', borderColor:'var(--border)', color:'var(--text)' }"
>
  <i class="bi bi-shield-lock me-2"></i> Admin
</router-link>


          <!-- Account -->
<!-- ACCOUNT DROPDOWN -->
<div class="relative">
  <button
    @click="showAccountMenu = !showAccountMenu"
    class="flex items-center gap-2 rounded-xl px-3 py-2 transition"
    :style="{ background:'var(--primary)', color:'white' }"
  >
    <i class="bi bi-person-circle text-lg"></i>
    <span class="hidden sm:inline">{{ displayName }}</span>
    <i class="bi bi-chevron-down text-xs"></i>
  </button>

  <!-- click outside -->
  <div
    v-if="showAccountMenu"
    class="fixed inset-0 z-40"
    @click="showAccountMenu = false"
  ></div>

  <!-- menu -->
  <div
    v-if="showAccountMenu"
    class="absolute right-0 mt-2 w-44 rounded-2xl border shadow-lg z-50 overflow-hidden"
    :style="{ background:'var(--surface)', borderColor:'var(--border)' }"
  >
    <router-link
      to="/account"
      @click="showAccountMenu = false"
      class="flex items-center gap-2 px-4 py-3 text-sm transition hover:bg-[var(--primary-soft)]"
      :style="{ color:'var(--text)' }"
    >
      <i class="bi bi-person"></i>
      Akun Saya
    </router-link>

    <button
    type="button"
      @click="logout"
      class="w-full text-left flex items-center gap-2 px-4 py-3 text-sm transition hover:bg-red-50"
      style="color: var(--danger)"
    >
      <i class="bi bi-box-arrow-right"></i>
      Logout
    </button>
  </div>
</div>
        </div>
      </div>
    </header>

    <!-- CONTENT -->
    <main class="max-w-6xl mx-auto px-4 py-6">
      <router-view />
    </main>
  </div>
</template>
