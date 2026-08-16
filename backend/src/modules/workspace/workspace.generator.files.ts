import fs from 'node:fs/promises'
import path from 'node:path'
import type { Preset } from './workspace.schema'
import type { Workspace, WorkspaceDocument } from './workspace.types'
import { buildTodoList } from './workspace.todo-list'

const presetLabels: Record<Preset, string> = { admin: '后台管理', website: '官网 / H5', tool: '业务工具' }
const documentNames: Record<WorkspaceDocument['type'], string> = { prd: '01-PRD.md', ux: '02-UX-SPEC.md', technical: '03-TECH-SOLUTION.md', database: '04-DATABASE-DESIGN.md', api: '05-API-SPEC.md', development: '06-DEVELOPMENT-PLAN.md', test: '07-TEST-ACCEPTANCE.md', release: '08-RELEASE-PLAN.md', changelog: '09-CHANGELOG.md' }

export async function writeGeneratedFiles(target: string, project: Workspace, documents: WorkspaceDocument[]) {
  await fs.mkdir(path.join(target, 'docs', 'product'), { recursive: true })
  for (const document of documents) await fs.writeFile(path.join(target, 'docs', 'product', documentNames[document.type]), document.markdown)
  await fs.writeFile(path.join(target, 'TODO.md'), buildTodoList(documents).markdown)
  await fs.writeFile(path.join(target, 'README.md'), readmeSource(project))
  await fs.writeFile(path.join(target, 'AGENTS.md'), agentsSource(project))
  await fs.appendFile(path.join(target, 'AGENTS.md'), '\n- 单个源文件不超过 300 行，按照功能职责拆分，禁止把多个业务域堆在一个文件中。\n')
  await fs.writeFile(path.join(target, 'frontend', 'src', 'router', 'index.ts'), routerSource)
  await fs.writeFile(path.join(target, 'frontend', 'src', 'views', 'HomeView.vue'), homeView(project))
  const presetNames = project.presets.map((preset) => presetLabels[preset]).join(' · ')
  await fs.writeFile(path.join(target, 'frontend', 'src', 'layouts', 'DefaultLayout.vue'), layoutSource(project, presetNames))
}

export async function validateTemplate(target: string) {
  for (const required of ['README.md', 'AGENTS.md', 'TODO.md', 'frontend/package.json', 'backend/package.json', 'docs/product/01-PRD.md']) await fs.access(path.join(target, required))
  for (const json of ['frontend/package.json', 'backend/package.json']) JSON.parse(await fs.readFile(path.join(target, json), 'utf8'))
  if (/\{\{[^}]+\}\}/.test(await fs.readFile(path.join(target, 'README.md'), 'utf8'))) throw new Error('Unresolved template placeholder')
}

function homeView(project: Workspace) {
  const map: Record<Preset, string[]> = { admin: ['运营概览', '数据管理', '权限与审计'], website: ['内容首页', '品牌信息', '联系入口'], tool: ['操作工作区', '处理结果', '历史记录'] }
  const sections = project.presets.flatMap((preset) => map[preset]); const labels = project.presets.map((preset) => presetLabels[preset]).join(' · ')
  return `<script setup lang="ts">\nconst sections = ${JSON.stringify(sections)}\n</script>\n<template><section class="starter"><header><span>${labels}</span><h1>${project.name}</h1><p>${project.summary}</p></header><div class="starter__grid"><article v-for="item in sections" :key="item"><h2>{{ item }}</h2><p>从 docs/product/01-PRD.md 开始定义该模块。</p></article></div></section></template>\n<style scoped lang="less">.starter{max-width:1100px;margin:0 auto;padding:48px 24px}.starter__grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.starter__grid article{border:1px solid #e2e8f0;border-radius:8px;padding:20px;background:#fff}@media(max-width:700px){.starter__grid{grid-template-columns:1fr}}</style>\n`
}

const routerSource = `import { createRouter, createWebHistory } from 'vue-router'\nimport DefaultLayout from '@/layouts/DefaultLayout.vue'\nexport const router = createRouter({ history: createWebHistory(), routes: [{ path: '/', component: DefaultLayout, children: [{ path: '', name: 'home', component: () => import('@/views/HomeView.vue') }] }] })\n`
function layoutSource(project: Workspace, presetNames: string) { return `<script setup lang="ts">
import { RouterView } from 'vue-router';
</script>
<template><div class="shell"><header><strong>${project.name}</strong><span>${presetNames}</span></header><main><RouterView /></main></div></template>
<style scoped lang="less">.shell{min-height:100vh;background:#f8fafc}header{height:56px;padding:0 24px;display:flex;align-items:center;justify-content:space-between;background:#fff;border-bottom:1px solid #e2e8f0}header span{font-size:13px;color:#64748b}</style>
` }
function readmeSource(project: Workspace) { return `# ${project.name}\n\n${project.summary}\n\n## 技术栈\n\n- 前端：Vue 3 + TypeScript + Vite\n- 后端：NestJS + TypeScript + Zod\n- 数据库：本地 SQLite，生产 PostgreSQL\n\n## Quickstart\n\n\`\`\`bash\ncd backend && npm install && cp .env.example .env && npm run dev\ncd frontend && npm install && npm run dev\n\`\`\`\n\n后端健康检查：\`GET http://127.0.0.1:3000/api/health\`。\n\n产品文档位于 \`docs/product/\`，执行清单位于 \`TODO.md\`。新增功能前先更新 PRD 和技术方案。\n` }
function agentsSource(project: Workspace) { return `# ${project.name} Agent Guide\n\n- 业务事实以 \`docs/product/01-PRD.md\` 为准，技术事实以 \`docs/product/03-TECH-SOLUTION.md\` 为准。\n- 前端业务放在闭环模块中；后端每个业务域使用独立 NestJS Module，模块之间不得直接互相导入。\n- NestJS Controller 只处理 HTTP 与 Zod 校验，Service 处理业务规则，Repository 只处理数据访问。\n- 前端只通过模块 api 层访问后端，后端统一返回 \`{ code, data, message }\`。\n- 按根目录 \`TODO.md\` 的编号顺序执行，每次只领取一个 Todo。\n- 每个 Todo 完成前运行 \`bash .agents/skills/vibecoding-verify/scripts/verify.sh\`。\n- 密钥和真实数据不得写入代码、文档、日志或 Git。\n` }
