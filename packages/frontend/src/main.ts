import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { PiniaColada } from '@pinia/colada'

import App from './App.vue'
import router from './router'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(PiniaColada, {
  queryOptions: {
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
  },
})
app.use(router)

app.mount('#app')
