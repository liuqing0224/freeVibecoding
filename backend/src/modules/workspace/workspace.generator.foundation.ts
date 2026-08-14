import fs from 'node:fs/promises'
import path from 'node:path'

export async function copyFrontendFoundation(root: string, target: string) {
  const ignored = new Set(['node_modules', 'dist', 'data', '.env', '.DS_Store'])
  const filter = (source: string) => {
    const relative = path.relative(root, source)
    if (!relative) return true
    const segments = relative.split(path.sep)
    if (segments.some((segment) => ignored.has(segment))) return false
    if (relative.includes(`${path.sep}src${path.sep}modules${path.sep}todo`)) return false
    if (relative.includes(`${path.sep}src${path.sep}modules${path.sep}workspace`)) return false
    return true
  }
  await fs.cp(path.join(root, 'frontend'), path.join(target, 'frontend'), { recursive: true, filter })
  for (const file of ['.editorconfig', '.gitignore']) {
    try { await fs.copyFile(path.join(root, file), path.join(target, file)) } catch { /* optional */ }
  }
}

export async function locateTemplateRoot(cwd: string) {
  for (const candidate of [cwd, path.resolve(cwd, '..')]) {
    try {
      await fs.access(path.join(candidate, 'frontend', 'package.json'))
      await fs.access(path.join(candidate, 'backend', 'package.json'))
      return candidate
    } catch { /* try parent */ }
  }
  throw new Error('Could not locate the template repository root')
}
