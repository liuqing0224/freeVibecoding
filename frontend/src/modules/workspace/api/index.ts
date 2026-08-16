import { http } from '@/utils/request'
import type { Bootstrap, CodingAgent, CodingAgentId, DocumentType, DocumentUpdateInput, GenerateInput, Generation, InterviewMessage, InterviewResponse, ProjectCreateInput, ProjectInterviewResponse, Readiness, TechnicalSyncResult, TodoList, Workspace, WorkspaceDocument, WorkspaceSettings } from '../types'

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
  interview: (id: string, agentId: CodingAgentId, message: string, history: InterviewMessage[], workingDocument: string, focusDocumentType?: DocumentType) => http.post<InterviewResponse>(`/workspace/projects/${id}/interview`, { agentId, focusDocumentType, message, history, workingDocument }),
  getDocument: (id: string, type: DocumentType) => http.get<WorkspaceDocument>(`/workspace/projects/${id}/documents/${type}`),
  saveDocument: (id: string, type: DocumentType, input: DocumentUpdateInput) => http.patch<WorkspaceDocument>(`/workspace/projects/${id}/documents/${type}`, input),
  syncTechnicalDocuments: (id: string) => http.post<TechnicalSyncResult>(`/workspace/projects/${id}/sync-technical-documents`),
  readiness: (id: string) => http.get<Readiness>(`/workspace/projects/${id}/readiness`),
  todoList: (id: string) => http.get<TodoList>(`/workspace/projects/${id}/todo-list`),
  generate: (id: string, input: GenerateInput) => http.post<Generation>(`/workspace/projects/${id}/generate`, input),
  generations: (id: string) => http.get<Generation[]>(`/workspace/projects/${id}/generations`),
}
