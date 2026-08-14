import fp from 'fastify-plugin'
import { workspaceRoutes } from './workspace.routes'

export default fp(async (app) => { await app.register(workspaceRoutes, { prefix: '/api/workspace' }) }, { name: 'module-workspace' })
export type { Workspace } from './workspace.types'
export { ProjectCreateSchema, ProjectSchema } from './workspace.schema'
