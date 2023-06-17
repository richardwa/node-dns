import './main.css'
import 'tabulator-tables/dist/css/tabulator_simple.min.css'

import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'

const app = createApp(App)

app.use(router)

app.mount('#app')
