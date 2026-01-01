import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import ProductDetail from '../views/ProductDetail.vue'
import Cart from '../views/Cart.vue'
import Login from '../views/Login.vue'
import Account from '../views/Account.vue'
import Register from '../views/Register.vue'
import AdminDashboard from '../views/admin/AdminDashboard.vue'
import AdminProducts from '../views/admin/AdminProducts.vue'
import AdminProductEdit from '../views/admin/AdminProductEdit.vue'

import { supabase } from '../lib/supabase'
import { waitForAuthReady } from '../lib/authReady'


const routes = [
  { path: '/', component: Home },
  { path: '/product/:code', component: ProductDetail },
  { path: '/cart', component: Cart },
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  { path: '/account', component: Account, meta: { requiresAuth: true } },
  { path: '/admin', component: AdminDashboard, meta: { requiresAuth: true, requiresAdmin: true } },
{ path: '/admin/products', component: AdminProducts, meta: { requiresAuth: true, requiresAdmin: true } },
{ path: '/admin/products/:id', component: AdminProductEdit, meta: { requiresAuth: true, requiresAdmin: true } },

]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  await waitForAuthReady()

  const { data } = await supabase.auth.getSession()
  const session = data.session
  const isLoggedIn = !!session

  if (to.meta.requiresAuth && !isLoggedIn) return '/login'

  if (to.meta.requiresAdmin) {
    const uid = session?.user?.id
    if (!uid) return '/login'

    const { data: prof } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', uid)
      .maybeSingle()

    if (prof?.role !== 'admin') return '/'
  }

  return true
})



export default router
