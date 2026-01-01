<script setup>
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { useRouter } from 'vue-router'

const router = useRouter()
const email = ref('')
const password = ref('')
const loading = ref(false)

async function signUp() {
  loading.value = true
  const { error } = await supabase.auth.signUp({
    email: email.value,
    password: password.value
  })
  loading.value = false
  if (error) return alert(error.message)
  alert('Registrasi berhasil. Cek email jika diminta verifikasi.')
}

async function signIn() {
  loading.value = true
  const { error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value
  })
  loading.value = false
  if (error) return alert(error.message)
  router.push('/account')
}
</script>

<template>
  <div
    class="min-h-screen grid place-items-center px-4"
    :style="{ background:'var(--bg)', color:'var(--text)' }"
  >
    <!-- CARD -->
    <div
      class="w-full max-w-md rounded-3xl border shadow-md p-6"
      :style="{ background:'var(--surface-2)', borderColor:'var(--border)' }"
    >
      <!-- HEADER -->
      <div class="flex items-center gap-3">
        <span
          class="inline-flex h-11 w-11 items-center justify-center rounded-2xl text-white"
          :style="{ background:'var(--primary)' }"
        >
          <i class="bi bi-person-circle text-xl"></i>
        </span>
        <div>
          <h1 class="text-2xl font-semibold text-[var(--text)]">Login</h1>
          <p class="text-sm text-[var(--text-muted)]">
            Login untuk isi alamat & checkout.
          </p>
        </div>
      </div>

      <!-- FORM -->
      <div class="mt-6 space-y-4">
        <div>
          <label class="text-sm font-medium text-[var(--text)]">Email</label>
          <input
            v-model="email"
            type="email"
            placeholder="contoh@email.com"
            class="mt-2 w-full rounded-xl border-2 px-4 py-3 outline-none transition"
            :style="{
              background:'var(--surface)',
              borderColor:'var(--border)',
              color:'var(--text)'
            }"
          />
        </div>

        <div>
          <label class="text-sm font-medium text-[var(--text)]">Password</label>
          <input
            v-model="password"
            type="password"
            placeholder="••••••••"
            class="mt-2 w-full rounded-xl border-2 px-4 py-3 outline-none transition"
            :style="{
              background:'var(--surface)',
              borderColor:'var(--border)',
              color:'var(--text)'
            }"
          />
        </div>
      </div>

      <!-- ACTION -->
<div class="mt-6 grid grid-cols-2 gap-3">
  <button
    @click="signIn"
    :disabled="loading"
    class="px-4 py-3 rounded-2xl text-white font-medium transition disabled:opacity-50"
    :style="{ background:'var(--primary)' }"
  >
    Login
  </button>

  <router-link
    to="/register"
    class="px-4 py-3 rounded-2xl border font-medium transition text-center"
    :style="{ background:'var(--surface)', borderColor:'var(--border)', color:'var(--text)' }"
  >
    Register
  </router-link>
</div>

      <!-- FOOTER -->
      <router-link
        to="/"
        class="block mt-5 text-sm hover:underline"
        :style="{ color:'var(--text-muted)' }"
      >
        ← Kembali ke katalog
      </router-link>
    </div>
  </div>
</template>
