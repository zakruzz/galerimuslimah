import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import './style.css'
import App from './App.vue'
import { useThemeStore } from './stores/theme'
import VueSweetalert2 from 'vue-sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia).use(router)

app.use(VueSweetalert2);

useThemeStore(pinia).init()

app.mount('#app')
