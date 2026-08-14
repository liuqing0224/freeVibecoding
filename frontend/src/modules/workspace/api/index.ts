import { http } from '@/utils/request'
import type { Bootstrap, CodingAgent, CodingAgentId, DocumentType, DocumentUpdateInput, Generation, InterviewMessage, InterviewResponse, ProjectCreateInput, ProjectInterviewResponse, Readiness, TodoList, Workspace, WorkspaceDocument, WorkspaceSettings } from '../types'

export const workspaceApi = {
  bootstrap: () => http.get<Bootstrap>('/workspace/bootstrap'),
  agents: () => http.get<CodingAgent[]>('/workspace/agents'),
  projectInterview: (agentId: CodingAgentId, message: string, history: InterviewMessage[], draft: Partial<ProjectCreateInput>, workingDocument: string) => http.post<ProjectInterviewResponse>('/workspace/project-interview', { agentId, message, history, draft, workingDocument }),
  updateSettings: (outputRoot: string) => http.patch<WorkspaceSettings>('/workspace/settings', { outputRoot }),
  listProjects: () => http.get<Workspace[]>('/workspace/projects'),
  getProject: (id: string) => http.get<Workspace>(`/workspace/projects/${id}`),
  createProject: (input: ProjectCreateInput) => http.post<Workspace>('/workspace/projects', input),
  updateProject: (id: string, input: Partial<Pick<Workspace, 'name' | 'summary' | 'status'>>) => http.patch<Workspace>(`/workspace/projects/${id}`, input),
  removeProject: (id: string) => http.delete<{ id: string }>(`/workspace/projects/${id}`),
  listDocuments: (id: string) => http.get<WorkspaceDocument[]>(`/workspace/projects/${id}/documents`),
  interview: (id: string, agentId: CodingAgentId, message: string, history: InterviewMessage[], workingDocument: string) => http.post<InterviewResponse>(`/workspace/projects/${id}/interview`, { agentId, message, history, workingDocument }),
  getDocument: (id: string, type: DocumentType) => http.get<WorkspaceDocument>(`/workspace/projects/${id}/documents/${type}`),
  saveDocument: (id: string, type: DocumentType, input: DocumentUpdateInput) => http.patch<WorkspaceDocument>(`/workspace/projects/${id}/documents/${type}`, input),
  readiness: (id: string) => http.get<Readiness>(`/workspace/projects/${id}/readiness`),
  todoList: (id: string) => http.get<TodoList>(`/workspace/projects/${id}/todo-list`),
  generate: (id: string, directoryName?: string) => http.post<Generation>(`/workspace/projects/${id}/generate`, { directoryName }),
  generations: (id: string) => http.get<Generation[]>(`/workspace/projects/${id}/generations`),
}
