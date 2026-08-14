import type { FastifyInstance } from 'fastify'
import { workspaceController } from './workspace.controller'

export async function workspaceRoutes(app: FastifyInstance) {
  app.get('/bootstrap', workspaceController.bootstrap)
  app.get('/agents', workspaceController.agents)
  app.post('/project-interview', workspaceController.projectInterview)
  app.get('/settings', workspaceController.settings)
  app.patch('/settings', workspaceController.updateSettings)
  app.get('/projects', workspaceController.list)
  app.post('/projects', workspaceController.create)
  app.get('/projects/:id', workspaceController.get)
  app.patch('/projects/:id', workspaceController.update)
  app.delete('/projects/:id', workspaceController.remove)
  app.get('/projects/:id/documents', workspaceController.documents)
  app.post('/projects/:id/interview', workspaceController.interview)
  app.get('/projects/:id/documents/:type', workspaceController.document)
  app.patch('/projects/:id/documents/:type', workspaceController.updateDocument)
  app.get('/projects/:id/readiness', workspaceController.readiness)
  app.get('/projects/:id/todo-list', workspaceController.todoList)
  app.post('/projects/:id/generate', workspaceController.generate)
  app.get('/projects/:id/generations', workspaceController.generations)
}
