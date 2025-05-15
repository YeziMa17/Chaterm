import './assets/main.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import i18n from './locales'
import contextmenu from 'v-contextmenu'
import 'v-contextmenu/dist/themes/default.css'

import 'ant-design-vue/dist/reset.css'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
const app = createApp(App)
//路由
app.use(router)
//国际化
app.use(i18n)
//状态管理
app.use(pinia)
// 右键
app.use(contextmenu)
app.mount('#app')
export { pinia }
