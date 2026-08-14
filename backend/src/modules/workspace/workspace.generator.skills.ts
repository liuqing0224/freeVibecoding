import fs from 'node:fs/promises'
import path from 'node:path'

export async function writeNestSkills(target: string) {
  const skillRoot = path.join(target, '.agents/skills')
  await replaceSkill(path.join(skillRoot, 'vibecoding-codex-workflow'), `---\nname: vibecoding-codex-workflow\ndescription: Default workflow for developing this generated Vue and NestJS project.\n---\n\n# Development Workflow\n\n1. Read \`AGENTS.md\`, \`TODO.md\` and the relevant product documents.\n2. Work on one numbered Todo only.\n3. Design the affected frontend module, NestJS module, API contract and database change before coding.\n4. Use the matching frontend, backend or fullstack skill.\n5. Keep every source file under 300 lines; split by feature responsibility before reaching the limit.\n6. Make a small reversible change and verify its acceptance result.\n7. Run \`bash .agents/skills/vibecoding-verify/scripts/verify.sh\` before marking the Todo complete.\n`)
  await replaceSkill(path.join(skillRoot, 'vibecoding-architecture-design'), `---\nname: vibecoding-architecture-design\ndescription: Design a change within the generated Vue and NestJS architecture before coding.\n---\n\n# Architecture Design Gate\n\nBefore editing, state the current files, target module, change boundary, Zod/API contract, database impact, execution order and verification commands. NestJS modules use Module → Controller → Service → Repository flow. Frontend modules use View → Store → API flow. Modules must not import each other directly.\n`)
  await replaceSkill(path.join(skillRoot, 'vibecoding-backend-module'), `---\nname: vibecoding-backend-module\ndescription: Create or modify a NestJS business module with Zod contracts, service, repository and paired database migrations.\n---\n\n# NestJS Backend Module\n\n1. Create one folder under \`backend/src/modules/<name>/\`.\n2. Keep \`<name>.module.ts\`, controller, service, repository and schema in that folder.\n3. Controller validates input with Zod and delegates to Service.\n4. Service owns business rules; Repository owns data access through the Database interface.\n5. Register the module only in \`app.module.ts\`; modules must not import each other directly.\n6. Keep every source file under 300 lines; split controllers, services, repositories and contracts by responsibility.\n7. Add matching SQLite and PostgreSQL migrations.\n8. Run backend type-check, lint and build before completion.\n`)
  const verifyRoot = path.join(skillRoot, 'vibecoding-verify')
  await replaceSkill(verifyRoot, `---\nname: vibecoding-verify\ndescription: Verify the generated Vue and NestJS project before completion.\n---\n\n# Verify\n\nRun \`bash .agents/skills/vibecoding-verify/scripts/verify.sh\` and finish only when it prints \`verify: ALL PASSED\`.\n`)
  const script = path.join(verifyRoot, 'scripts/verify.sh')
  await fs.mkdir(path.dirname(script), { recursive: true })
  await fs.writeFile(script, '#!/usr/bin/env bash\nset -euo pipefail\n(cd backend && npm run type-check && npm run lint && npm run build)\n(cd frontend && npm run type-check && npm run lint && npm run build)\necho \'verify: ALL PASSED\'\n')
  await fs.chmod(script, 0o755)
}

async function replaceSkill(directory: string, content: string) {
  await fs.rm(directory, { recursive: true, force: true })
  await fs.mkdir(directory, { recursive: true })
  await fs.writeFile(path.join(directory, 'SKILL.md'), content)
}
