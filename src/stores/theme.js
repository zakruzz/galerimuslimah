import { defineStore } from 'pinia'

export const useThemeStore = defineStore('theme', {
  state: () => ({ dark: false }),
  actions: {
    init() {
      const saved = localStorage.getItem('theme_dark')
      this.dark = saved ? saved === '1' : window.matchMedia('(prefers-color-scheme: dark)').matches
      document.documentElement.classList.toggle('dark', this.dark)
    },
    toggle() {
      this.dark = !this.dark
      localStorage.setItem('theme_dark', this.dark ? '1' : '0')
      document.documentElement.classList.toggle('dark', this.dark)
    }
  }
})
