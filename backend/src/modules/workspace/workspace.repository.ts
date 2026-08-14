import os from 'node:os'
import path from 'node:path'
import { db } from '@/db'
import { nanoid } from '@/utils/id'
import { PresetSchema, type DocumentType, type DocumentUpdateInput, type Preset, type ProjectCreateInput, type ProjectUpdateInput } from './workspace.schema'
import type { DocumentRow, Generation, GenerationRow, ProjectRow, Workspace, WorkspaceDocument } from './workspace.types'
import { documentCompleteness, initialDocuments, renderMarkdown } from './workspace.documents'

const iso = (value: string | Date) => value instanceof Date ? value.toISOString() : value
function parsePresets(value: string): Preset[] {
  try { return zPresets(JSON.parse(value)) } catch { return [PresetSchema.parse(value)] }
}
function zPresets(value: unknown): Preset[] { return PresetSchema.array().min(1).parse(value) }
function toProject(row: ProjectRow, completeness = 0): Workspace { return { id: row.id, name: row.name, slug: row.slug, presets: parsePresets(row.preset), summary: row.summary, deliveryTier: row.delivery_tier, status: row.status, completeness, createdAt: iso(row.created_at), updatedAt: iso(row.updated_at) } }
function toDocument(row: DocumentRow): WorkspaceDocument { const content = JSON.parse(row.content_json) as Record<string, unknown>; return { id: row.id, projectId: row.project_id, type: row.type, content, completeness: row.completeness, markdown: row.markdown_content ?? renderMarkdown(row.type, content), updatedAt: iso(row.updated_at) } }
function toGeneration(row: GenerationRow): Generation { return { id: row.id, projectId: row.project_id, targetPath: row.target_path, presets: parsePresets(row.preset), status: row.status, commitHash: row.commit_hash, errorMessage: row.error_message, createdAt: iso(row.created_at) } }

export const workspaceRepository = {
  async settings() {
    const row = await db.queryOne<{ output_root: string; updated_at: string | Date }>("SELECT output_root, updated_at FROM workspace_settings WHERE id = 'default'")
    if (row) return { outputRoot: row.output_root, updatedAt: iso(row.updated_at) }
    const now = new Date().toISOString(); const outputRoot = path.join(os.homedir(), 'Documents', 'VibeCodingProjects')
    await db.execute('INSERT INTO workspace_settings (id, output_root, updated_at) VALUES (?, ?, ?)', ['default', outputRoot, now])
    return { outputRoot, updatedAt: now }
  },
  async updateSettings(outputRoot: string) { const now = new Date().toISOString(); await this.settings(); await db.execute("UPDATE workspace_settings SET output_root = ?, updated_at = ? WHERE id = 'default'", [outputRoot, now]); return { outputRoot, updatedAt: now } },
  async list(): Promise<Workspace[]> { const rows = await db.query<ProjectRow>('SELECT * FROM workspace_project ORDER BY updated_at DESC'); return Promise.all(rows.map(async (row) => toProject(row, await this.projectCompleteness(row.id)))) },
  async find(id: string): Promise<Workspace | null> { const row = await db.queryOne<ProjectRow>('SELECT * FROM workspace_project WHERE id = ?', [id]); return row ? toProject(row, await this.projectCompleteness(id)) : null },
  async create(input: ProjectCreateInput): Promise<Workspace> {
    const id = nanoid(); const now = new Date().toISOString(); const docs = initialDocuments(input)
    await db.transaction(async (tx) => {
      await tx.execute('INSERT INTO workspace_project (id, name, slug, preset, summary, delivery_tier, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [id, input.name, input.slug, JSON.stringify(input.presets), input.summary, input.deliveryTier, 'draft', now, now])
      for (const [type, content] of Object.entries(docs) as Array<[DocumentType, Record<string, unknown>]>) await tx.execute('INSERT INTO workspace_document (id, project_id, type, content_json, completeness, markdown_content, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)', [nanoid(), id, type, JSON.stringify(content), documentCompleteness(type, content), renderMarkdown(type, content), now])
    })
    return (await this.find(id))!
  },
  async update(id: string, input: ProjectUpdateInput) { const current = await this.find(id); if (!current) return null; const now = new Date().toISOString(); await db.execute('UPDATE workspace_project SET name = ?, summary = ?, status = ?, updated_at = ? WHERE id = ?', [input.name ?? current.name, input.summary ?? current.summary, input.status ?? current.status, now, id]); return this.find(id) },
  async remove(id: string) { return (await db.execute('DELETE FROM workspace_project WHERE id = ?', [id])).rowsAffected > 0 },
  async documents(projectId: string) { return (await db.query<DocumentRow>('SELECT * FROM workspace_document WHERE project_id = ? ORDER BY type', [projectId])).map(toDocument) },
  async document(projectId: string, type: DocumentType) { const row = await db.queryOne<DocumentRow>('SELECT * FROM workspace_document WHERE project_id = ? AND type = ?', [projectId, type]); return row ? toDocument(row) : null },
  async updateDocument(projectId: string, type: DocumentType, input: DocumentUpdateInput) {
    const now = new Date().toISOString()
    if (input.content !== undefined) {
      const markdown = input.markdown ?? renderMarkdown(type, input.content)
      await db.execute('UPDATE workspace_document SET content_json = ?, completeness = ?, markdown_content = ?, updated_at = ? WHERE project_id = ? AND type = ?', [JSON.stringify(input.content), documentCompleteness(type, input.content), markdown, now, projectId, type])
    } else {
      await db.execute('UPDATE workspace_document SET markdown_content = ?, updated_at = ? WHERE project_id = ? AND type = ?', [input.markdown, now, projectId, type])
    }
    await db.execute('UPDATE workspace_project SET updated_at = ? WHERE id = ?', [now, projectId])
    return this.document(projectId, type)
  },
  async projectCompleteness(projectId: string) { const rows = await db.query<{ completeness: number }>('SELECT completeness FROM workspace_document WHERE project_id = ?', [projectId]); return rows.length ? Math.round(rows.reduce((sum, row) => sum + Number(row.completeness), 0) / rows.length) : 0 },
  async generations(projectId: string) { return (await db.query<GenerationRow>('SELECT * FROM workspace_generation WHERE project_id = ? ORDER BY created_at DESC', [projectId])).map(toGeneration) },
  async recordGeneration(input: Omit<Generation, 'id' | 'createdAt'>) { const id = nanoid(); const createdAt = new Date().toISOString(); await db.execute('INSERT INTO workspace_generation (id, project_id, target_path, preset, status, commit_hash, error_message, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [id, input.projectId, input.targetPath, JSON.stringify(input.presets), input.status, input.commitHash, input.errorMessage, createdAt]); return { id, createdAt, ...input } },
}
