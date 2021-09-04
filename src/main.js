import {createApp} from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import {createHead} from '@vueuse/head'
import 'bootstrap/dist/css/bootstrap.min.css'
import '@fortawesome/fontawesome-free/css/all.min.css'

const head = createHead()
createApp(App).use(store).use(router).use(head).mount('#app')
