import { defineStore } from 'pinia'
import { ref } from 'vue'
import { workspaceApi } from '../api'
import type { Bootstrap, DocumentType, DocumentUpdateInput, ProjectCreateInput, Workspace, WorkspaceDocument } from '../types'

export const useWorkspaceStore = defineStore('workspace', () => {
  const bootstrap = ref<Bootstrap | null>(null)
  const projects = ref<Workspace[]>([])
  const currentProject = ref<Workspace | null>(null)
  const documents = ref<WorkspaceDocument[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadBootstrap() { bootstrap.value ??= await workspaceApi.bootstrap(); return bootstrap.value }
  async function loadProjects() { loading.value = true; error.value = null; try { projects.value = await workspaceApi.listProjects() } catch (e) { error.value = (e as Error).message } finally { loading.value = false } }
  async function createProject(input: ProjectCreateInput) { const project = await workspaceApi.createProject(input); projects.value = [project, ...projects.value]; return project }
  async function loadProject(id: string) { const [project, docs] = await Promise.all([workspaceApi.getProject(id), workspaceApi.listDocuments(id)]); currentProject.value = project; documents.value = docs; return project }
  async function saveDocument(id: string, type: DocumentType, input: DocumentUpdateInput) {
    const saved = await workspaceApi.saveDocument(id, type, input)
    documents.value = documents.value.map((item) => item.type === type ? saved : item)
    if (currentProject.value && documents.value.length) currentProject.value.completeness = Math.round(documents.value.reduce((sum, item) => sum + item.completeness, 0) / documents.value.length)
    return saved
  }
  async function removeProject(id: string) { await workspaceApi.removeProject(id); projects.value = projects.value.filter((project) => project.id !== id) }
  return { bootstrap, projects, currentProject, documents, loading, error, loadBootstrap, loadProjects, createProject, loadProject, saveDocument, removeProject }
})
