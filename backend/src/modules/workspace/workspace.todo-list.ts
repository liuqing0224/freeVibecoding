import type { TodoGroup, TodoItem } from './workspace.schema'
import type { WorkspaceDocument } from './workspace.types'

type Row = Record<string, unknown>
type Category = TodoItem['category']

const groupTitles: Record<Category, string> = { planning: '业务功能与实施准备', data: '数据库', api: 'API 接口', frontend: '页面与交互', engineering: '工程质量', quality: '测试与问题修复', release: '发布与回退' }
const prefixes: Record<Category, string> = { planning: 'PLAN', data: 'DATA', api: 'API', frontend: 'PAGE', engineering: 'ENG', quality: 'QA', release: 'REL' }
const documentTitles: Record<WorkspaceDocument['type'], string> = { prd: 'PRD 产品需求', ux: '交互与页面说明', technical: '技术方案', database: '数据库设计', api: 'API 接口', development: '开发实施计划', test: '测试与业务验收', release: '上线发布方案', changelog: '迭代、变更与问题' }

function rows(content: Record<string, unknown>, field: string): Row[] { return Array.isArray(content[field]) ? (content[field] as Row[]) : [] }
const fieldLabels: Record<string, string> = { asset: '保护对象', threat: '风险', control: '控制措施', verification: '验证', scenario: '场景', metric: '指标', scale: '规模', target: '目标', approach: '实现策略', environment: '环境', purpose: '用途', data: '数据', config: '配置', deployment: '部署方式' }
function describe(value: unknown): string {
  if (Array.isArray(value)) return value.map(describe).filter(Boolean).join(' / ')
  if (value && typeof value === 'object') return Object.entries(value as Row).filter(([, item]) => item !== '' && item != null).map(([key, item]) => `${fieldLabels[key] ?? key}：${String(item)}`).join('；')
  return String(value ?? '').trim()
}

export function buildTodoList(documents: WorkspaceDocument[]): { groups: TodoGroup[]; total: number; markdown: string } {
  const byType = new Map(documents.map((document) => [document.type, document]))
  const buckets = new Map<Category, TodoItem[]>()
  const add = (category: Category, title: string, detail: string, acceptance: string, sourceDocument: WorkspaceDocument['type'], sourceField: string) => {
    const items = buckets.get(category) ?? []
    items.push({ id: `${prefixes[category]}-${String(items.length + 1).padStart(3, '0')}`, category, title, detail, acceptance, sourceDocument: documentTitles[sourceDocument], sourceField })
    buckets.set(category, items)
  }

  const prd = byType.get('prd')?.content ?? {}
  for (const row of rows(prd, 'features')) add('planning', `实现功能：${row.name || '未命名功能'}`, String(row.rule || '按 PRD 业务规则实现'), String(row.acceptance || '通过对应业务验收'), 'prd', '功能需求')
  const development = byType.get('development')?.content ?? {}
  for (const row of rows(development, 'tasks')) add('planning', `实施任务 ${row.order || ''}：${row.task || '未命名任务'}`.trim(), String(development.scope || '按开发范围实施'), String(row.done || '任务可独立验证并提交'), 'development', '任务拆分')
  const database = byType.get('database')?.content ?? {}
  for (const row of rows(database, 'tables')) add('data', `数据库字段：${row.table || '未命名表'}.${row.field || '未命名字段'}`, `类型：${row.type || '待确认'}；约束：${row.rule || '无额外约束'}`, 'SQLite 与 PostgreSQL 迁移成对，字段读写、默认值和约束验证通过', 'database', '表与字段')
  const api = byType.get('api')?.content ?? {}
  for (const row of rows(api, 'endpoints')) add('api', `${row.method || 'METHOD'} ${row.path || '/path'}：${row.purpose || '未说明用途'}`, `权限：${row.permission || '按统一权限约定'}；遵守接口认证、响应、分页和错误约定`, '该接口的 zod 契约、业务实现、权限、错误处理和自动化测试全部完成', 'api', '接口清单')
  const ux = byType.get('ux')?.content ?? {}
  for (const row of rows(ux, 'pages')) add('frontend', `实现页面：${row.name || '未命名页面'}`, `入口：${row.entry || '待确认'}；核心任务：${row.task || '待确认'}`, '页面主流程及加载、空数据、成功、失败、无权限状态均可验证', 'ux', '页面清单')
  const technical = byType.get('technical')?.content ?? {}
  for (const [field, label, sourceField] of [['securityModel', '落实安全与权限方案', '安全与权限'], ['performance', '落实性能、稳定性与兼容方案', '性能、稳定性与兼容'], ['environments', '配置开发、测试、预发和生产环境', '环境与部署'], ['releaseRollback', '验证技术风险与回退方案', '风险与回退']] as const) {
    const detail = describe(technical[field])
    if (detail) add('engineering', label, detail, `${label}有代码、配置或验证证据`, 'technical', sourceField)
  }
  const test = byType.get('test')?.content ?? {}
  for (const row of rows(test, 'cases')) add('quality', `验收用例：${row.requirement || '未命名需求'}`, `步骤：${row.steps || '待补充'}`, String(row.expected || '结果符合预期'), 'test', '测试用例')
  const changelog = byType.get('changelog')?.content ?? {}
  for (const row of rows(changelog, 'bugs')) add('quality', `修复 BUG：${row.issue || '未命名问题'}`, `等级：${row.severity || '待评估'}`, String(row.resolution || '修复完成并通过回归'), 'changelog', 'BUG 记录')
  const release = byType.get('release')?.content ?? {}
  for (const row of rows(release, 'rollout')) add('release', `执行灰度：${row.group || '未命名批次'}`, `观察时间：${row.duration || '待确认'}`, `未触发停止阈值：${row.threshold || '按发布方案判断'}`, 'release', '灰度批次')
  if (release.monitoring) add('release', '配置上线监控与告警', String(release.monitoring), '核心指标可观察，异常能够触发告警', 'release', '监控和告警')
  if (release.rollback) add('release', '演练发布回退', String(release.rollback), '回退步骤已演练并记录证据', 'release', '回退步骤')

  const order: Category[] = ['planning', 'data', 'api', 'frontend', 'engineering', 'quality', 'release']
  const groups = order.filter((category) => buckets.get(category)?.length).map((category) => ({ category, title: groupTitles[category], items: buckets.get(category)! }))
  const lines = ['# 开发 TodoList', '', '> 本清单由九份产研文档自动派生。修改需求时先更新对应文档，再重新生成清单。', '']
  for (const group of groups) {
    lines.push(`## ${group.title}`, '')
    for (const item of group.items) lines.push(`- [ ] **${item.id}** ${item.title}`, `  - 说明：${item.detail}`, `  - 完成标准：${item.acceptance}`, `  - 来源：${item.sourceDocument} · ${item.sourceField}`)
    lines.push('')
  }
  return { groups, total: groups.reduce((sum, group) => sum + group.items.length, 0), markdown: lines.join('\n') }
}
