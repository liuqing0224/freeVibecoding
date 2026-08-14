import type { RouteRecordRaw } from 'vue-router'

export const workspaceRoutes: RouteRecordRaw[] = [
  { path: 'projects', name: 'workspace-projects', component: () => import('./views/ProjectListView.vue') },
  { path: 'projects/new', name: 'workspace-new', component: () => import('./views/ProjectInterviewView.vue') },
  { path: 'projects/new/manual', name: 'workspace-new-manual', component: () => import('./views/ProjectWizardView.vue') },
  { path: 'projects/:id/documents/:type?', name: 'workspace-documents', component: () => import('./views/DocumentEditorView.vue') },
  { path: 'projects/:id/interview', name: 'workspace-interview', component: () => import('./views/InterviewView.vue') },
  { path: 'projects/:id/todo-list', name: 'workspace-todo-list', component: () => import('./views/TodoListView.vue') },
  { path: 'projects/:id/generate', name: 'workspace-generate', component: () => import('./views/GenerateView.vue') },
  { path: 'settings', name: 'workspace-settings', component: () => import('./views/SettingsView.vue') },
]
