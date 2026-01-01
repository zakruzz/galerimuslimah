<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase'
import { useRouter } from 'vue-router'

const router = useRouter()
const userId = ref('')
const loading = ref(true)
const saving = ref(false)

const form = ref({
  full_name: '',
  phone: '',
  address: '',
  city: '',
  postal_code: ''
})

onMounted(async () => {
  const { data: sess } = await supabase.auth.getSession()
  if (!sess.session) return router.push('/login')
  userId.value = sess.session.user.id

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId.value)
    .maybeSingle()

  if (data) Object.assign(form.value, data)
  loading.value = false
})

function isComplete() {
  const f = form.value
  return f.full_name && f.phone && f.address && f.city && f.postal_code
}

async function save() {
  saving.value = true
  const payload = { user_id: userId.value, ...form.value, updated_at: new Date().toISOString() }
  const { error } = await supabase.from('profiles').upsert(payload)
  saving.value = false
  if (error) return alert(error.message)
  alert('Profil tersimpan.')
}
</script>

<template>
  <div v-if="loading" class="text-[var(--text-muted)]">Loading...</div>

  <div v-else class="max-w-2xl mx-auto">
    <!-- PAGE HEADER -->
    <div>
      <h1 class="text-2xl md:text-3xl font-semibold text-[var(--text)]">
        Akun & Alamat
      </h1>
      <p class="mt-1 text-[var(--text-muted)]">
        Lengkapi data ini untuk checkout via WhatsApp.
      </p>
    </div>

    <!-- CARD -->
    <div
      class="mt-6 rounded-3xl border shadow-md"
      :style="{ background:'var(--surface-2)', borderColor:'var(--border)' }"
    >
      <!-- CARD HEADER -->
      <div class="p-5 md:p-6 border-b" :style="{ borderColor:'var(--border)' }">
        <div class="flex items-center gap-3">
          <span
            class="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-white"
            :style="{ background:'var(--primary)' }"
          >
            <i class="bi bi-person-vcard"></i>
          </span>
          <div>
            <div class="font-semibold text-[var(--text)]">Data Pembeli</div>
            <div class="text-sm text-[var(--text-muted)]">
              Pastikan nomor HP aktif (WhatsApp).
            </div>
          </div>
        </div>
      </div>

      <!-- FORM -->
      <div class="p-5 md:p-6 space-y-5">
        <!-- Nama + HP -->
        <div class="grid md:grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-medium text-[var(--text)]">Nama lengkap</label>
            <div class="mt-2 relative">
              <i class="bi bi-person absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"></i>
              <input
                v-model="form.full_name"
                placeholder="Contoh: Ahmad Fairuz"
                class="w-full rounded-xl border-2 px-11 py-3 outline-none transition"
                :style="inputStyle"
              />
            </div>
          </div>

          <div>
            <label class="text-sm font-medium text-[var(--text)]">No HP (WhatsApp)</label>
            <div class="mt-2 relative">
              <i class="bi bi-telephone absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"></i>
              <input
                v-model="form.phone"
                placeholder="Contoh: 08xxxxxxxxxx"
                class="w-full rounded-xl border-2 px-11 py-3 outline-none transition"
                :style="inputStyle"
              />
            </div>
          </div>
        </div>

        <!-- Alamat -->
        <div>
          <label class="text-sm font-medium text-[var(--text)]">Alamat lengkap</label>
          <div class="mt-2 relative">
            <i class="bi bi-geo-alt absolute left-4 top-4 text-[var(--text-muted)]"></i>
            <textarea
              v-model="form.address"
              rows="4"
              placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, kecamatan..."
              class="w-full rounded-xl border-2 px-11 py-3 outline-none resize-none transition"
              :style="inputStyle"
            ></textarea>
          </div>
        </div>

        <!-- Kota + Kodepos -->
        <div class="grid md:grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-medium text-[var(--text)]">Kota</label>
            <div class="mt-2 relative">
              <i class="bi bi-buildings absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"></i>
              <input
                v-model="form.city"
                placeholder="Contoh: Surabaya"
                class="w-full rounded-xl border-2 px-11 py-3 outline-none transition"
                :style="inputStyle"
              />
            </div>
          </div>

          <div>
            <label class="text-sm font-medium text-[var(--text)]">Kode pos</label>
            <div class="mt-2 relative">
              <i class="bi bi-mailbox absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"></i>
              <input
                v-model="form.postal_code"
                placeholder="Contoh: 60111"
                class="w-full rounded-xl border-2 px-11 py-3 outline-none transition"
                :style="inputStyle"
              />
            </div>
          </div>
        </div>

        <!-- FOOTER -->
        <div class="pt-2 flex items-center justify-between gap-3">
          <span
            class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm"
            :style="isComplete()
              ? { background:'var(--success)', color:'#052e16' }
              : { background:'var(--warning)', color:'#422006' }"
          >
            <i :class="isComplete() ? 'bi bi-check-circle' : 'bi bi-exclamation-circle'"></i>
            {{ isComplete() ? 'Data lengkap, siap checkout' : 'Lengkapi data untuk checkout' }}
          </span>

          <button
            @click="save"
            :disabled="saving"
            class="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-white transition disabled:opacity-50"
            :style="{ background:'var(--primary)' }"
          >
            <i class="bi bi-save"></i>
            <span>{{ saving ? 'Menyimpan...' : 'Simpan' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  computed: {
    inputStyle() {
      return {
        background: 'var(--surface)',
        borderColor: 'var(--border)',
        color: 'var(--text)'
      }
    }
  }
}
</script>
