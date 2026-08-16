import type { FastifyReply, FastifyRequest } from 'fastify'
import { success } from '@/utils/response'
import { DocumentParamSchema, DocumentUpdateSchema, GenerateInputSchema, IdParamSchema, InterviewInputSchema, ProjectCreateSchema, ProjectInterviewInputSchema, ProjectUpdateSchema, WorkspaceSettingsUpdateSchema } from './workspace.schema'
import { workspaceService } from './workspace.service'

export const workspaceController = {
  async bootstrap(_req: FastifyRequest, reply: FastifyReply) { return reply.send(success(await workspaceService.bootstrap())) },
  async agents(_req: FastifyRequest, reply: FastifyReply) { return reply.send(success(await workspaceService.agents())) },
  async projectInterview(req: FastifyRequest, reply: FastifyReply) { const input = ProjectInterviewInputSchema.parse(req.body); return reply.send(success(await workspaceService.projectInterview(input))) },
  async interview(req: FastifyRequest, reply: FastifyReply) { const { id } = IdParamSchema.parse(req.params); const input = InterviewInputSchema.parse(req.body); return reply.send(success(await workspaceService.interview(id, input))) },
  async settings(_req: FastifyRequest, reply: FastifyReply) { return reply.send(success(await workspaceService.settings())) },
  async updateSettings(req: FastifyRequest, reply: FastifyReply) { const input = WorkspaceSettingsUpdateSchema.parse(req.body); return reply.send(success(await workspaceService.updateSettings(input.outputRoot), 'updated')) },
  async list(_req: FastifyRequest, reply: FastifyReply) { return reply.send(success(await workspaceService.list())) },
  async get(req: FastifyRequest, reply: FastifyReply) { const { id } = IdParamSchema.parse(req.params); return reply.send(success(await workspaceService.get(id))) },
  async create(req: FastifyRequest, reply: FastifyReply) { const input = ProjectCreateSchema.parse(req.body); return reply.status(201).send(success(await workspaceService.create(input), 'created')) },
  async update(req: FastifyRequest, reply: FastifyReply) { const { id } = IdParamSchema.parse(req.params); const input = ProjectUpdateSchema.parse(req.body); return reply.send(success(await workspaceService.update(id, input), 'updated')) },
  async remove(req: FastifyRequest, reply: FastifyReply) { const { id } = IdParamSchema.parse(req.params); return reply.send(success(await workspaceService.remove(id), 'deleted')) },
  async documents(req: FastifyRequest, reply: FastifyReply) { const { id } = IdParamSchema.parse(req.params); return reply.send(success(await workspaceService.documents(id))) },
  async document(req: FastifyRequest, reply: FastifyReply) { const { id, type } = DocumentParamSchema.parse(req.params); return reply.send(success(await workspaceService.document(id, type))) },
  async updateDocument(req: FastifyRequest, reply: FastifyReply) { const { id, type } = DocumentParamSchema.parse(req.params); const input = DocumentUpdateSchema.parse(req.body); return reply.send(success(await workspaceService.updateDocument(id, type, input), 'saved')) },
  async syncTechnicalDocuments(req: FastifyRequest, reply: FastifyReply) { const { id } = IdParamSchema.parse(req.params); return reply.send(success(await workspaceService.syncTechnicalDocuments(id), 'synced')) },
  async readiness(req: FastifyRequest, reply: FastifyReply) { const { id } = IdParamSchema.parse(req.params); return reply.send(success(await workspaceService.readiness(id))) },
  async todoList(req: FastifyRequest, reply: FastifyReply) { const { id } = IdParamSchema.parse(req.params); return reply.send(success(await workspaceService.todoList(id))) },
  async generate(req: FastifyRequest, reply: FastifyReply) { const { id } = IdParamSchema.parse(req.params); const input = GenerateInputSchema.parse(req.body ?? {}); return reply.status(201).send(success(await workspaceService.generate(id, input), 'generated')) },
  async generations(req: FastifyRequest, reply: FastifyReply) { const { id } = IdParamSchema.parse(req.params); return reply.send(success(await workspaceService.generations(id))) },
}
