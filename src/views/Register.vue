<script setup>
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { useRouter } from 'vue-router'

const router = useRouter()
const fullName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)

function validate() {
  if (!fullName.value.trim()) return 'Nama wajib diisi.'
  if (!email.value || !password.value) return 'Email dan password wajib diisi.'
  if (password.value.length < 6) return 'Password minimal 6 karakter.'
  if (password.value !== confirmPassword.value) return 'Konfirmasi password tidak sama.'
  return ''
}

async function register() {
  const msg = validate()
  if (msg) return alert(msg)

  loading.value = true

  const { error } = await supabase.auth.signUp({
    email: email.value,
    password: password.value,
    options: {
      data: {
        full_name: fullName.value.trim(),
        role: 'customer',
      },
    },
  })

  loading.value = false

  if (error) return alert(error.message)

  alert('Registrasi berhasil. Silakan login. (Cek email jika diminta verifikasi)')
  router.push('/login')
}

</script>

<template>
  <div class="min-h-screen grid place-items-center px-4" :style="{ background:'var(--bg)', color:'var(--text)' }">
    <div class="w-full max-w-md rounded-3xl border shadow-md p-6"
         :style="{ background:'var(--surface-2)', borderColor:'var(--border)' }">

      <div class="flex items-center gap-3">
        <span class="inline-flex h-11 w-11 items-center justify-center rounded-2xl text-white"
              :style="{ background:'var(--primary)' }">
          <i class="bi bi-person-plus-fill text-xl"></i>
        </span>
        <div>
          <h1 class="text-2xl font-semibold text-[var(--text)]">Register</h1>
          <p class="text-sm text-[var(--text-muted)]">Buat akun untuk bisa checkout.</p>
        </div>
      </div>

      <div class="mt-6 space-y-4">
        <div>
          <label class="text-sm font-medium text-[var(--text)]">Nama lengkap</label>
          <input v-model="fullName" type="text" placeholder="Contoh: Ahmad Fairuz"
                 class="mt-2 w-full rounded-xl border-2 px-4 py-3 outline-none transition"
                 :style="{ background:'var(--surface)', borderColor:'var(--border)', color:'var(--text)' }" />
        </div>

        <div>
          <label class="text-sm font-medium text-[var(--text)]">Email</label>
          <input v-model="email" type="email" placeholder="contoh@email.com"
                 class="mt-2 w-full rounded-xl border-2 px-4 py-3 outline-none transition"
                 :style="{ background:'var(--surface)', borderColor:'var(--border)', color:'var(--text)' }" />
        </div>

        <div>
          <label class="text-sm font-medium text-[var(--text)]">Password</label>
          <input v-model="password" type="password" placeholder="Minimal 6 karakter"
                 class="mt-2 w-full rounded-xl border-2 px-4 py-3 outline-none transition"
                 :style="{ background:'var(--surface)', borderColor:'var(--border)', color:'var(--text)' }" />
        </div>

        <div>
          <label class="text-sm font-medium text-[var(--text)]">Konfirmasi password</label>
          <input v-model="confirmPassword" type="password" placeholder="Ulangi password"
                 class="mt-2 w-full rounded-xl border-2 px-4 py-3 outline-none transition"
                 :style="{ background:'var(--surface)', borderColor:'var(--border)', color:'var(--text)' }" />
        </div>
      </div>

      <button class="mt-6 w-full px-4 py-3 rounded-2xl text-white font-medium transition disabled:opacity-50"
              :style="{ background:'var(--primary)' }"
              :disabled="loading"
              @click="register">
        {{ loading ? 'Memproses...' : 'Buat Akun' }}
      </button>

      <p class="mt-4 text-sm text-[var(--text-muted)]">
        Sudah punya akun?
        <router-link to="/login" class="font-medium hover:underline" :style="{ color:'var(--primary)' }">
          Login
        </router-link>
      </p>

      <router-link to="/" class="block mt-3 text-sm hover:underline" :style="{ color:'var(--text-muted)' }">
        ← Kembali ke katalog
      </router-link>
    </div>
  </div>
</template>
