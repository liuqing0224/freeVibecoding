export type Preset = 'admin' | 'website' | 'tool'
export type DeliveryTier = 'demo' | 'business' | 'commercial'
export type DocumentType = 'prd' | 'ux' | 'technical' | 'database' | 'api' | 'development' | 'test' | 'release' | 'changelog'
export type FieldType = 'text' | 'textarea' | 'select' | 'multiselect' | 'checklist' | 'table'

export interface DocumentField { id: string; label: string; type: FieldType; required: boolean; group?: string; help?: string; options?: Array<{ label: string; value: string }>; columns?: Array<{ id: string; label: string }> }
export interface DocumentDefinition { type: DocumentType; title: string; description: string; fields: DocumentField[] }
export interface PresetDefinition { id: Preset; name: string; description: string }
export interface WorkspaceSettings { outputRoot: string; updatedAt: string }
export interface Bootstrap { presets: PresetDefinition[]; documentDefinitions: DocumentDefinition[]; settings: WorkspaceSettings }
export interface Workspace {
  id: string
  name: string
  slug: string
  presets: Preset[]
  summary: string
  deliveryTier: DeliveryTier
  status: 'draft' | 'ready' | 'generated'
  completeness: number
  createdAt: string
  updatedAt: string
}
export interface ProjectCreateInput { name: string; slug: string; presets: Preset[]; summary: string; deliveryTier: DeliveryTier; targetUsers: string; painPoints: string; successMetric: string; mustHave: string[]; excluded: string[]; roles: string[]; dataSensitivity: 'none' | 'normal' | 'personal' | 'sensitive'; devices: string[]; expectedScale: string; integrations: string[] }
export interface WorkspaceDocument { id: string; projectId: string; type: DocumentType; content: Record<string, unknown>; completeness: number; markdown: string; updatedAt: string }
export interface DocumentUpdateInput { content?: Record<string, unknown>; markdown?: string }
export interface Readiness { ready: boolean; completeness: number; missing: Array<{ documentType: DocumentType; fieldId: string; label: string }>; targetPath: string; suggestedDirectoryName: string }
export type TodoCategory = 'planning' | 'data' | 'api' | 'frontend' | 'engineering' | 'quality' | 'release'
export interface TodoItem { id: string; category: TodoCategory; title: string; detail: string; acceptance: string; sourceDocument: string; sourceField: string }
export interface TodoGroup { category: TodoCategory; title: string; items: TodoItem[] }
export interface TodoList { ready: boolean; completeness: number; missing: Array<{ documentType: DocumentType; fieldId: string; label: string }>; groups: TodoGroup[]; total: number; markdown: string }
export interface Generation { id: string; projectId: string; targetPath: string; presets: Preset[]; status: 'success' | 'failed'; commitHash: string | null; errorMessage: string | null; createdAt: string }
export type CodingAgentId = 'codex' | 'claude'
export interface CodingAgent { id: CodingAgentId; name: string; available: boolean; version: string | null; path: string | null }
export interface InterviewMessage { role: 'user' | 'assistant'; content: string }
export interface DocumentPatch { documentType: DocumentType; fields: Record<string, unknown> }
export interface InterviewResponse { reply: string; questions: string[]; patches: DocumentPatch[]; workingDocument: string }
export interface ProjectInterviewResponse { reply: string; questions: string[]; projectDraft: Partial<ProjectCreateInput>; workingDocument: string }
