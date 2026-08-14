import fp from 'fastify-plugin'
import todoModule from './modules/todo'
import workspaceModule from './modules/workspace'

/**
 * Aggregates every business module's plugin. To add a new module, register
 * its default-exported plugin here. The module decides its own URL prefix.
 */
export default fp(
  async (app) => {
    await app.register(todoModule)
    await app.register(workspaceModule)
  },
  { name: 'app-routes' },
)
