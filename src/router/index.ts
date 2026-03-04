import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'Home', component: () => import('@/apps/Home.vue') },
    { path: '/kami2', name: 'Kami2', component: () => import('@/apps/kami2/index.vue') },
    { path: '/sudoku', name: 'Sudoku', component: () => import('@/apps/sudoku/index.vue') },
  ],
})

export default router
