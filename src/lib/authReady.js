import { supabase } from './supabase'

let ready = false
let readyPromise = null

export function waitForAuthReady() {
  if (ready) return Promise.resolve(true)

  if (!readyPromise) {
    readyPromise = new Promise((resolve) => {
      // Begitu auth state event pertama kali terjadi, artinya supabase auth sudah init
      const { data } = supabase.auth.onAuthStateChange(() => {
        ready = true
        data.subscription.unsubscribe()
        resolve(true)
      })

      // Trigger init check (agar onAuthStateChange kepanggil segera)
      supabase.auth.getSession().then(() => {})
    })
  }

  return readyPromise
}
