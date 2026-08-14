import fs from 'node:fs/promises'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { nanoid } from '@/utils/id'
import type { Workspace, WorkspaceDocument } from './workspace.types'
import { copyFrontendFoundation, locateTemplateRoot } from './workspace.generator.foundation'
import { writeNestBackend } from './workspace.generator.nest'
import { writeNestSkills } from './workspace.generator.skills'
import { validateTemplate, writeGeneratedFiles } from './workspace.generator.files'

const exec = promisify(execFile)

export async function generateRepository(rootInput: string, directoryName: string, project: Workspace, documents: WorkspaceDocument[]) {
  const sourceRoot = await locateTemplateRoot(process.cwd())
  await fs.mkdir(rootInput, { recursive: true })
  const root = await fs.realpath(rootInput); const target = path.resolve(root, directoryName)
  if (!target.startsWith(`${root}${path.sep}`)) throw new Error('Target must stay inside the configured output root')
  try { await fs.lstat(target); throw new Error(`Target directory already exists: ${target}`) } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error }
  const temporary = path.join(root, `.${directoryName}.tmp-${nanoid(6)}`)
  await fs.mkdir(temporary)
  try {
    await copyFrontendFoundation(sourceRoot, temporary)
    await writeNestBackend(temporary, project)
    await writeNestSkills(temporary)
    await writeGeneratedFiles(temporary, project, documents)
    await validateTemplate(temporary)
    await exec('git', ['init'], { cwd: temporary }); await exec('git', ['add', '.'], { cwd: temporary })
    await exec('git', ['-c', 'user.name=Vibe Coding Workbench', '-c', 'user.email=workbench@local', 'commit', '-m', 'chore: initialize project template'], { cwd: temporary })
    const { stdout } = await exec('git', ['rev-parse', 'HEAD'], { cwd: temporary })
    await fs.rename(temporary, target)
    return { targetPath: target, commitHash: stdout.trim() }
  } catch (error) { await fs.rm(temporary, { recursive: true, force: true }); throw error }
}
