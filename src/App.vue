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

const isAdmin = ref(false)
const displayName = ref('Admin')

const showAccountMenu = ref(false)   // dropdown desktop admin
const mobileOpen = ref(false)        // hamburger drawer

function closeAllMenus() {
  showAccountMenu.value = false
  mobileOpen.value = false
}

watch(() => route.fullPath, () => {
  closeAllMenus()
})

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
  closeAllMenus()

  const { error } = await supabase.auth.signOut()
  if (error) {
    await $swal({ icon: 'error', title: 'Logout gagal', text: error.message })
    return
  }

  await $swal({ icon: 'success', title: 'Logout berhasil', text: 'Anda akan diarahkan ke login admin.' })

  isAdmin.value = false
  displayName.value = 'Admin'

  if (route.path.startsWith('/admin')) {
    router.replace('/login')
  }
}

// ESC close mobile drawer
function onKeyDown(e) {
  if (e.key === 'Escape') closeAllMenus()
}

let sub
onMounted(async () => {
  await refreshAdminState()

  const { data } = supabase.auth.onAuthStateChange(async () => {
    await refreshAdminState()

    if (route.meta?.requiresAuth) {
      const { data: sess } = await supabase.auth.getSession()
      if (!sess.session) await router.replace('/login')
    }
  })
  sub = data.subscription

  window.addEventListener('keydown', onKeyDown)
})

onBeforeUnmount(() => {
  sub?.unsubscribe()
  window.removeEventListener('keydown', onKeyDown)
})
</script>

<template>
  <div class="min-h-screen" :style="{ background:'var(--bg)', color:'var(--text)' }">
    <!-- NAVBAR -->
    <header
      class="sticky top-0 z-50 border-b backdrop-blur"
      :style="{ background:'var(--surface)', borderColor:'var(--border)' }"
    >
      <div class="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center gap-3">
        <!-- Brand -->
        <router-link to="/" class="flex items-center gap-2 font-semibold text-lg shrink-0">
          <span
            class="h-9 w-9 rounded-2xl grid place-items-center text-white"
            :style="{ background:'var(--primary)' }"
          >
            <i class="bi bi-bag-heart-fill"></i>
          </span>
          <span class="hidden sm:inline" :style="{ color:'var(--primary)' }">Katalog Baju</span>
          <span class="sm:hidden" :style="{ color:'var(--primary)' }">Katalog</span>
        </router-link>

        <!-- DESKTOP MENU (md+) -->
        <div class="hidden md:flex items-center gap-2">
          <!-- Theme -->
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
            <span>Keranjang</span>
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
            <span>Checkout</span>
          </router-link>

          <!-- Admin (desktop) -->
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
              <span>{{ displayName }}</span>
              <i class="bi bi-chevron-down text-xs"></i>
            </button>

            <div
              v-if="isAdmin && showAccountMenu"
              class="absolute right-0 mt-2 w-56 rounded-2xl border overflow-hidden shadow-lg"
              :style="{ background:'var(--surface)', borderColor:'var(--border)' }"
            >
              <router-link
                to="/admin"
                @click="showAccountMenu=false"
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

        <!-- MOBILE MENU BUTTON (<md) -->
        <div class="md:hidden flex items-center gap-2">
          <!-- quick cart icon -->
          <router-link
            to="/cart"
            class="relative rounded-xl border px-3 py-2"
            :style="{ background:'var(--surface)', borderColor:'var(--border)' }"
          >
            <i class="bi bi-cart3"></i>
            <span
              v-if="cart.totalItems"
              class="absolute -top-2 -right-2 text-xs px-2 h-6 rounded-full grid place-items-center text-white"
              :style="{ background:'var(--primary)' }"
            >
              {{ cart.totalItems }}
            </span>
          </router-link>

          <!-- hamburger -->
          <button
            class="rounded-xl border px-3 py-2"
            :style="{ background:'var(--surface)', borderColor:'var(--border)' }"
            @click="mobileOpen = true"
            aria-label="Open menu"
          >
            <i class="bi bi-list text-xl"></i>
          </button>
        </div>
      </div>
    </header>

    <!-- MOBILE DRAWER + OVERLAY -->
    <div v-if="mobileOpen" class="fixed inset-0 z-[60]">
      <!-- overlay -->
      <button
        class="absolute inset-0 w-full h-full"
        style="background: rgba(0,0,0,.45)"
        @click="mobileOpen=false"
        aria-label="Close menu"
      ></button>

      <!-- drawer -->
      <aside
        class="absolute right-0 top-0 h-full w-[86%] max-w-sm border-l shadow-xl p-4"
        :style="{ background:'var(--surface)', borderColor:'var(--border)', color:'var(--text)' }"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2 font-semibold">
            <span
              class="h-9 w-9 rounded-2xl grid place-items-center text-white"
              :style="{ background:'var(--primary)' }"
            >
              <i class="bi bi-bag-heart-fill"></i>
            </span>
            <span>Katalog Baju</span>
          </div>

          <button
            class="rounded-xl border px-3 py-2"
            :style="{ background:'var(--surface)', borderColor:'var(--border)' }"
            @click="mobileOpen=false"
            aria-label="Close"
          >
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <div class="mt-4 space-y-2">
          <router-link
            to="/"
            class="w-full flex items-center gap-3 rounded-xl border px-4 py-3"
            :style="{ borderColor:'var(--border)', background:'var(--bg)', color:'var(--text)' }"
            @click="mobileOpen=false"
          >
            <i class="bi bi-house"></i>
            <span>Beranda</span>
          </router-link>

          <router-link
            to="/cart"
            class="w-full flex items-center justify-between rounded-xl border px-4 py-3"
            :style="{ borderColor:'var(--border)', background:'var(--bg)', color:'var(--text)' }"
            @click="mobileOpen=false"
          >
            <div class="flex items-center gap-3">
              <i class="bi bi-cart3"></i>
              <span>Keranjang</span>
            </div>
            <span
              v-if="cart.totalItems"
              class="text-xs px-2 h-6 rounded-full grid place-items-center text-white"
              :style="{ background:'var(--primary)' }"
            >
              {{ cart.totalItems }}
            </span>
          </router-link>

          <router-link
            to="/checkout"
            class="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-white"
            :style="{ background:'var(--primary)' }"
            @click="mobileOpen=false"
          >
            <i class="bi bi-whatsapp"></i>
            <span>Checkout</span>
          </router-link>

          <button
            class="w-full flex items-center gap-3 rounded-xl border px-4 py-3"
            :style="{ borderColor:'var(--border)', background:'var(--bg)', color:'var(--text)' }"
            @click="theme.toggle()"
          >
            <i :class="theme.dark ? 'bi bi-sun' : 'bi bi-moon-stars'"></i>
            <span>{{ theme.dark ? 'Light Mode' : 'Dark Mode' }}</span>
          </button>
        </div>

        <div class="mt-4 pt-4 border-t" :style="{ borderColor:'var(--border)' }">
          <div class="text-sm opacity-70 mb-2">Admin</div>

          <router-link
            v-if="!isAdmin"
            to="/login"
            class="w-full flex items-center gap-3 rounded-xl border px-4 py-3"
            :style="{ borderColor:'var(--border)', background:'var(--bg)', color:'var(--text)' }"
            @click="mobileOpen=false"
          >
            <i class="bi bi-shield-lock"></i>
            <span>Admin Login</span>
          </router-link>

          <template v-else>
            <div class="flex items-center gap-3 rounded-xl border px-4 py-3"
              :style="{ borderColor:'var(--border)', background:'var(--bg)' }"
            >
              <i class="bi bi-person-circle text-lg"></i>
              <div class="leading-tight">
                <div class="font-medium">{{ displayName }}</div>
                <div class="text-xs opacity-70">Admin</div>
              </div>
            </div>

            <router-link
              to="/admin"
              class="mt-2 w-full flex items-center gap-3 rounded-xl border px-4 py-3"
              :style="{ borderColor:'var(--border)', background:'var(--bg)', color:'var(--text)' }"
              @click="mobileOpen=false"
            >
              <i class="bi bi-speedometer2"></i>
              <span>Dashboard Admin</span>
            </router-link>

            <button
              class="mt-2 w-full flex items-center gap-3 rounded-xl border px-4 py-3"
              :style="{ borderColor:'var(--border)', background:'var(--bg)', color:'var(--text)' }"
              @click="logout"
            >
              <i class="bi bi-box-arrow-right"></i>
              <span>Logout</span>
            </button>
          </template>
        </div>

        <p class="mt-4 text-xs opacity-60">
          Tekan <b>Esc</b> untuk menutup menu.
        </p>
      </aside>
    </div>

    <!-- CONTENT -->
    <main class="max-w-6xl mx-auto px-4 py-6">
      <router-view />
    </main>
  </div>
</template>
