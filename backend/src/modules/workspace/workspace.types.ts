import type { z } from 'zod'
import type { GenerationSchema, ProjectSchema, WorkspaceDocumentSchema } from './workspace.schema'

export type Workspace = z.infer<typeof ProjectSchema>
export type WorkspaceDocument = z.infer<typeof WorkspaceDocumentSchema>
export type Generation = z.infer<typeof GenerationSchema>

export interface ProjectRow {
  id: string; name: string; slug: string; preset: string; summary: string
  delivery_tier: 'demo' | 'business' | 'commercial'; status: 'draft' | 'ready' | 'generated'
  created_at: string | Date; updated_at: string | Date
}
export interface DocumentRow {
  id: string; project_id: string; type: WorkspaceDocument['type']; content_json: string
  completeness: number; markdown_content: string | null; updated_at: string | Date
}
export interface GenerationRow {
  id: string; project_id: string; target_path: string; preset: string
  status: Generation['status']; commit_hash: string | null; error_message: string | null
  created_at: string | Date
}
