import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import router from './router'
import '@/assets/base.scss'
import '@/assets/cust-elementplus.scss'
import '@/assets/icon/iconfont.css'
import Utils from './Utils/Utils'
const app = createApp(App)
app.config.globalProperties.Utils = Utils
app.use(ElementPlus)
app.use(router)
app.mount('#app')
