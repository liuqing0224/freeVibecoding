import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'

import { todoRoutes } from '@/modules/todo'
import { workspaceRoutes } from '@/modules/workspace'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: DefaultLayout,
    children: [
      {
        path: '',
        name: 'home',
        redirect: { name: 'workspace-projects' },
      },
      ...workspaceRoutes,
      ...todoRoutes,
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
