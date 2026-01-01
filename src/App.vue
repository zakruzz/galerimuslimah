<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
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

const isAdmin = ref(false)
const displayName = ref('Admin')
const showAccountMenu = ref(false)

function closeMenu() {
  showAccountMenu.value = false
}

watch(() => route.fullPath, closeMenu)

async function refreshAdminState() {
  const { data } = await supabase.auth.getSession()
  const session = data.session

  if (!session) {
    isAdmin.value = false
    displayName.value = 'Admin'
    return
  }

  const uid = session.user.id
  const { data: prof, error } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('user_id', uid)
    .maybeSingle()

  if (error) {
    isAdmin.value = false
    displayName.value = 'Admin'
    return
  }

  isAdmin.value = prof?.role === 'admin'
  displayName.value = (prof?.full_name?.trim() || session.user.email || 'Admin')
}

async function logout() {
  closeMenu()
  const { error } = await supabase.auth.signOut()

  if (error) {
    await $swal({ icon: 'error', title: 'Logout gagal', text: error.message })
    return
  }

  await $swal({ icon: 'success', title: 'Logout berhasil', text: 'Anda akan diarahkan ke login admin.' })

  isAdmin.value = false
  displayName.value = 'Admin'

  // kalau lagi di area admin, langsung lempar ke login
  if (route.path.startsWith('/admin')) {
    router.replace('/login')
  }
}

let sub
onMounted(async () => {
  await refreshAdminState()

  const { data } = supabase.auth.onAuthStateChange(async () => {
    await refreshAdminState()

    // kalau sedang berada di route yg butuh auth, dan session hilang -> lempar login
    if (route.meta?.requiresAuth) {
      const { data: sess } = await supabase.auth.getSession()
      if (!sess.session) await router.replace('/login')
    }
  })
  sub = data.subscription
})

onBeforeUnmount(() => sub?.unsubscribe())
</script>

<template>
  <div class="min-h-screen" :style="{ background:'var(--bg)', color:'var(--text)' }">
    <!-- NAVBAR -->
    <header
      class="sticky top-0 z-50 border-b backdrop-blur"
      :style="{ background:'var(--surface)', borderColor:'var(--border)' }"
    >
      <div class="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center gap-3">
        <router-link to="/" class="flex items-center gap-2 font-semibold text-lg">
          <span class="h-9 w-9 rounded-2xl grid place-items-center text-white" :style="{ background:'var(--primary)' }">
            <i class="bi bi-bag-heart-fill"></i>
          </span>
          <span :style="{ color:'var(--primary)' }">Katalog Baju</span>
        </router-link>

        <div class="flex items-center gap-2">
          <!-- Theme toggle -->
          <button
            class="rounded-xl border px-3 py-2"
            :style="{ background:'var(--surface)', borderColor:'var(--border)' }"
            @click="theme.toggle()"
            title="Toggle theme"
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

          <!-- Checkout -->
          <router-link
            to="/checkout"
            class="rounded-xl px-3 py-2 text-white flex items-center gap-2"
            :style="{ background:'var(--primary)' }"
          >
            <i class="bi bi-whatsapp"></i>
            <span class="hidden sm:inline">Checkout</span>
          </router-link>

          <!-- Admin (kalau sudah admin login -> dropdown, kalau belum -> link login admin) -->
          <div class="relative">
            <router-link
              v-if="!isAdmin"
              to="/login"
              class="rounded-xl border px-3 py-2 text-sm"
              :style="{ background:'var(--surface)', borderColor:'var(--border)', color:'var(--text)' }"
            >
              <i class="bi bi-shield-lock me-2"></i> Admin Login
            </router-link>

            <button
              v-else
              @click="showAccountMenu = !showAccountMenu"
              class="flex items-center gap-2 rounded-xl px-3 py-2 transition text-white"
              :style="{ background:'var(--primary)' }"
            >
              <i class="bi bi-person-circle text-lg"></i>
              <span class="hidden sm:inline">{{ displayName }}</span>
              <i class="bi bi-chevron-down text-xs"></i>
            </button>

            <!-- dropdown admin -->
            <div
              v-if="isAdmin && showAccountMenu"
              class="absolute right-0 mt-2 w-56 rounded-2xl border overflow-hidden shadow-lg"
              :style="{ background:'var(--surface)', borderColor:'var(--border)' }"
            >
              <router-link
                to="/admin"
                @click="closeMenu"
                class="flex items-center gap-2 px-4 py-3 text-sm transition"
                :style="{ color:'var(--text)' }"
              >
                <i class="bi bi-speedometer2"></i>
                Dashboard Admin
              </router-link>

              <div class="h-px" :style="{ background:'var(--border)' }"></div>

              <button
                type="button"
                @click="logout"
                class="w-full text-left flex items-center gap-2 px-4 py-3 text-sm transition"
                :style="{ color:'var(--text)' }"
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
