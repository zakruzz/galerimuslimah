import { defineStore } from 'pinia'

const KEY = 'cart_items_v1'

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: load(), // {productId, code, name, type, sizeName, priceFinal, qty, imageUrl}
  }),
  getters: {
    totalItems: (s) => s.items.reduce((a, i) => a + i.qty, 0),
    totalPrice: (s) => s.items.reduce((a, i) => a + i.priceFinal * i.qty, 0),
  },
  actions: {
    persist() {
      localStorage.setItem(KEY, JSON.stringify(this.items))
    },
    add(item) {
      const idx = this.items.findIndex(x =>
        x.productId === item.productId && x.sizeName === item.sizeName
      )
      if (idx >= 0) this.items[idx].qty += item.qty
      else this.items.push(item)
      this.persist()
    },
    removeAt(i) {
      this.items.splice(i, 1)
      this.persist()
    },
    clear() {
      this.items = []
      this.persist()
    },
    setQty(i, qty) {
      this.items[i].qty = Math.max(1, qty)
      this.persist()
    }
  }
})
