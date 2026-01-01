<script setup>
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { useRouter } from 'vue-router'
import { getCurrentInstance } from 'vue'

const { appContext } = getCurrentInstance()
const $swal = appContext.config.globalProperties.$swal

const router = useRouter()
const email = ref('')
const password = ref('')
const loading = ref(false)

async function signIn() {
  loading.value = true
  const { error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  })
  loading.value = false

  if (error) {
    await $swal({ icon: 'error', title: 'Login gagal', text: error.message })
    return
  }

  // masuk ke admin
  router.push('/admin')
}
</script>

<template>
  <div class="min-h-[70vh] grid place-items-center px-4">
    <div class="w-full max-w-md rounded-2xl border p-6"
      :style="{ background:'var(--surface)', borderColor:'var(--border)', color:'var(--text)' }"
    >
      <div class="flex items-center gap-3">
        <div class="h-11 w-11 rounded-2xl grid place-items-center text-white"
          :style="{ background:'var(--primary)' }">
          <i class="bi bi-shield-lock"></i>
        </div>
        <div>
          <h1 class="text-xl font-semibold">Admin Login</h1>
          <p class="text-sm opacity-70">Hanya admin yang bisa mengakses dashboard.</p>
        </div>
      </div>

      <div class="mt-5 space-y-3">
        <input v-model="email" type="email" placeholder="Email admin"
          class="w-full rounded-xl px-4 py-3 border"
          :style="{ background:'var(--bg)', borderColor:'var(--border)', color:'var(--text)' }"
        />
        <input v-model="password" type="password" placeholder="Password"
          class="w-full rounded-xl px-4 py-3 border"
          :style="{ background:'var(--bg)', borderColor:'var(--border)', color:'var(--text)' }"
        />
      </div>

      <button
        @click="signIn"
        :disabled="loading"
        class="mt-5 w-full px-4 py-3 rounded-xl text-white"
        :style="{ background:'var(--primary)' }"
      >
        {{ loading ? 'Memproses...' : 'Login Admin' }}
      </button>

      <router-link to="/" class="block mt-4 text-sm opacity-70 hover:underline">
        ← Kembali ke katalog
      </router-link>
    </div>
  </div>
</template>
