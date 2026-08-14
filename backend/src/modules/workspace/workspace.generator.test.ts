import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { generateRepository } from './workspace.generator'
import { documentDefinitions, initialDocuments, renderMarkdown } from './workspace.documents'
import type { ProjectCreateInput } from './workspace.schema'
import type { Workspace, WorkspaceDocument } from './workspace.types'

const input: ProjectCreateInput = { name: '测试项目', slug: 'test-project', presets: ['admin', 'website', 'tool'], summary: '这是一个用于验证模板仓库生成过程的测试项目。', deliveryTier: 'business', targetUsers: '内部运营', painPoints: '手工创建项目目录容易遗漏必要文件。', successMetric: '一分钟内创建完整模板', mustHave: ['项目列表'], excluded: [], roles: ['管理员'], dataSensitivity: 'normal', devices: ['desktop'], expectedScale: '50 人', integrations: [] }
const project: Workspace = { id: 'p1', name: input.name, slug: input.slug, presets: input.presets, summary: input.summary, deliveryTier: input.deliveryTier, status: 'ready', completeness: 100, createdAt: new Date(0).toISOString(), updatedAt: new Date(0).toISOString() }
const contents = initialDocuments(input)
const documents: WorkspaceDocument[] = documentDefinitions.map((definition, index) => ({ id: `d${index}`, projectId: project.id, type: definition.type, content: contents[definition.type], completeness: 100, markdown: renderMarkdown(definition.type, contents[definition.type]), updatedAt: project.updatedAt }))

test('generates a combined multi-preset repository with product docs and a clean project skeleton', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vibe-workbench-'))
  try {
    const editedMarkdown = '# 人工编辑后的 PRD\n\n这段内容必须原样进入仓库。\n'
    const editedDocuments = documents.map((document) => document.type === 'prd' ? { ...document, markdown: editedMarkdown } : document)
    const result = await generateRepository(root, project.slug, project, editedDocuments)
    assert.equal(result.targetPath, path.join(await fs.realpath(root), project.slug))
    assert.ok(result.commitHash.length >= 7)
    await fs.access(path.join(result.targetPath, 'docs/product/01-PRD.md'))
    await fs.access(path.join(result.targetPath, 'docs/product/09-CHANGELOG.md'))
    await fs.access(path.join(result.targetPath, 'TODO.md'))
    await assert.rejects(fs.access(path.join(result.targetPath, 'frontend/src/modules/todo')))
    await assert.rejects(fs.access(path.join(result.targetPath, 'backend/src/modules/workspace')))
    await assert.rejects(fs.access(path.join(result.targetPath, 'scripts/install-superpowers.sh')))
    const packageJson = JSON.parse(await fs.readFile(path.join(result.targetPath, 'backend/package.json'), 'utf8')) as { scripts: Record<string, string>; dependencies: Record<string, string> }
    assert.equal(packageJson.scripts.test, undefined)
    assert.ok(packageJson.dependencies['@nestjs/core'])
    assert.equal(packageJson.dependencies.fastify, undefined)
    await fs.access(path.join(result.targetPath, 'backend/src/main.ts'))
    await fs.access(path.join(result.targetPath, 'backend/src/app.module.ts'))
    await fs.access(path.join(result.targetPath, 'backend/src/modules/health/health.module.ts'))
    await fs.access(path.join(result.targetPath, 'backend/src/common/filters/global-exception.filter.ts'))
    await assert.rejects(fs.access(path.join(result.targetPath, 'backend/src/server.ts')))
    const home = await fs.readFile(path.join(result.targetPath, 'frontend/src/views/HomeView.vue'), 'utf8')
    for (const section of ['运营概览', '内容首页', '操作工作区']) assert.match(home, new RegExp(section))
    const agents = await fs.readFile(path.join(result.targetPath, 'AGENTS.md'), 'utf8')
    const workflow = await fs.readFile(path.join(result.targetPath, '.agents/skills/vibecoding-codex-workflow/SKILL.md'), 'utf8')
    assert.match(agents, /300 行/)
    assert.match(workflow, /300 lines/)
    assert.equal(await fs.readFile(path.join(result.targetPath, 'docs/product/01-PRD.md'), 'utf8'), editedMarkdown)
  } finally { await fs.rm(root, { recursive: true, force: true }) }
})

test('refuses to overwrite an existing directory', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vibe-workbench-'))
  try {
    await fs.mkdir(path.join(root, project.slug))
    await assert.rejects(generateRepository(root, project.slug, project, documents), /already exists/)
  } finally { await fs.rm(root, { recursive: true, force: true }) }
})

test('rejects a target outside the configured root', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vibe-workbench-'))
  try { await assert.rejects(generateRepository(root, '../escape', project, documents), /inside/) }
  finally { await fs.rm(root, { recursive: true, force: true }) }
})
