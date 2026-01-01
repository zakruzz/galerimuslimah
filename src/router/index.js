import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import ProductDetail from '../views/ProductDetail.vue'
import Cart from '../views/Cart.vue'
import Checkout from '../views/Checkout.vue'
import Login from '../views/Login.vue'

import AdminDashboard from '../views/admin/AdminDashboard.vue'
import AdminProducts from '../views/admin/AdminProducts.vue'
import AdminProductEdit from '../views/admin/AdminProductEdit.vue'

import { supabase } from '../lib/supabase'

const routes = [
  // PUBLIC
  { path: '/', component: Home },
  { path: '/product/:code', component: ProductDetail },
  { path: '/cart', component: Cart },
  { path: '/checkout', component: Checkout },

  // ADMIN LOGIN
  { path: '/login', component: Login },

  // ADMIN ONLY
  { path: '/admin', component: AdminDashboard, meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/admin/products', component: AdminProducts, meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/admin/products/:id', component: AdminProductEdit, meta: { requiresAuth: true, requiresAdmin: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  // halaman publik tidak perlu auth
  if (!to.meta.requiresAuth) return true

  const { data } = await supabase.auth.getSession()
  const session = data.session
  if (!session) return '/login'

  // cek admin role
  if (to.meta.requiresAdmin) {
    const uid = session.user.id
    const { data: prof, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', uid)
      .maybeSingle()

    if (error) return '/login'
    if (prof?.role !== 'admin') return '/' // bukan admin
  }

  return true
})

export default router
