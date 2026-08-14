import path from 'node:path'
import { BadRequestError, ConflictError, NotFoundError } from '@/utils/http-error'
import { documentDefinitions, missingRequiredFields, presetDefinitions } from './workspace.documents'
import { runInterview, runProjectInterview, scanCodingAgents } from './workspace.agent'
import { generateRepository } from './workspace.generator'
import { workspaceRepository } from './workspace.repository'
import { buildTodoList } from './workspace.todo-list'
import type { DocumentType, DocumentUpdateInput, GenerateInput, ProjectCreateInput, ProjectUpdateInput } from './workspace.schema'

async function projectOrThrow(id: string) { const project = await workspaceRepository.find(id); if (!project) throw NotFoundError('project'); return project }

export const workspaceService = {
  async bootstrap() { return { presets: presetDefinitions, documentDefinitions, settings: await workspaceRepository.settings() } },
  agents: () => scanCodingAgents(),
  async projectInterview(input: import('./workspace.schema').ProjectInterviewInput) {
    try { return await runProjectInterview(input) }
    catch (error) { throw BadRequestError((error as Error).message) }
  },
  async interview(id: string, input: import('./workspace.schema').InterviewInput) {
    try { return await runInterview(await projectOrThrow(id), await workspaceRepository.documents(id), input) }
    catch (error) { throw BadRequestError((error as Error).message) }
  },
  settings: () => workspaceRepository.settings(),
  async updateSettings(outputRoot: string) { if (!path.isAbsolute(outputRoot)) throw BadRequestError('Output root must be an absolute path'); return workspaceRepository.updateSettings(path.resolve(outputRoot)) },
  list: () => workspaceRepository.list(),
  get: projectOrThrow,
  create: (input: ProjectCreateInput) => workspaceRepository.create(input),
  async update(id: string, input: ProjectUpdateInput) { await projectOrThrow(id); return (await workspaceRepository.update(id, input))! },
  async remove(id: string) { await projectOrThrow(id); await workspaceRepository.remove(id); return { id } },
  async documents(id: string) { await projectOrThrow(id); return workspaceRepository.documents(id) },
  async document(id: string, type: DocumentType) { await projectOrThrow(id); const doc = await workspaceRepository.document(id, type); if (!doc) throw NotFoundError('document'); return doc },
  async updateDocument(id: string, type: DocumentType, input: DocumentUpdateInput) { await this.document(id, type); return (await workspaceRepository.updateDocument(id, type, input))! },
  async readiness(id: string, directoryName?: string) {
    const project = await projectOrThrow(id); const documents = await workspaceRepository.documents(id)
    const missing = documents.flatMap((document) => {
      return missingRequiredFields(document.type, document.content).map((field) => ({ documentType: document.type, fieldId: field.id, label: field.label }))
    })
    const settings = await workspaceRepository.settings(); const name = directoryName ?? project.slug
    let suggested = name; let suffix = 2
    const fs = await import('node:fs/promises')
    while (true) { try { await fs.access(path.join(settings.outputRoot, suggested)); suggested = `${name}-v${suffix++}` } catch { break } }
    return { ready: missing.length === 0, completeness: project.completeness, missing, targetPath: path.join(settings.outputRoot, name), suggestedDirectoryName: suggested }
  },
  async todoList(id: string) {
    const readiness = await this.readiness(id)
    if (!readiness.ready) return { ready: false, completeness: readiness.completeness, missing: readiness.missing, groups: [], total: 0, markdown: '' }
    const result = buildTodoList(await workspaceRepository.documents(id))
    return { ready: true, completeness: readiness.completeness, missing: [], ...result }
  },
  async generate(id: string, input: GenerateInput) {
    const project = await projectOrThrow(id); const readiness = await this.readiness(id, input.directoryName)
    if (!readiness.ready) throw BadRequestError('Complete all required document fields before generating')
    const settings = await workspaceRepository.settings(); const directoryName = input.directoryName ?? project.slug
    if (readiness.suggestedDirectoryName !== directoryName) throw ConflictError(`Directory exists. Suggested name: ${readiness.suggestedDirectoryName}`)
    try {
      const generated = await generateRepository(settings.outputRoot, directoryName, project, await workspaceRepository.documents(id))
      await workspaceRepository.update(id, { status: 'generated' })
      return workspaceRepository.recordGeneration({ projectId: id, targetPath: generated.targetPath, presets: project.presets, status: 'success', commitHash: generated.commitHash, errorMessage: null })
    } catch (error) {
      await workspaceRepository.recordGeneration({ projectId: id, targetPath: path.join(settings.outputRoot, directoryName), presets: project.presets, status: 'failed', commitHash: null, errorMessage: (error as Error).message })
      throw BadRequestError((error as Error).message)
    }
  },
  async generations(id: string) { await projectOrThrow(id); return workspaceRepository.generations(id) },
}
