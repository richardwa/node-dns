import { createRouter, createWebHashHistory } from 'vue-router'
import ListView from '@/client/views/ListView.vue'

const staticPaths = {
  list: '/',
  report: '/report'
}

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: staticPaths.list,
      name: 'list',
      component: ListView
    },
    {
      path: staticPaths.report,
      name: 'report',
      component: () => import('@/client/views/ReportView.vue')
    }
  ]
})

export { router, staticPaths }
