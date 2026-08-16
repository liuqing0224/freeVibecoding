import assert from 'node:assert/strict'
import test from 'node:test'
import { buildTodoList } from './workspace.todo-list'
import { scoreDocument } from './workspace.document-score'
import type { WorkspaceDocument } from './workspace.types'

function document(type: WorkspaceDocument['type'], content: Record<string, unknown>): WorkspaceDocument {
  return { id: type, projectId: 'p1', type, content, completeness: 100, quality: scoreDocument(type, content, ''), markdown: '', updatedAt: new Date(0).toISOString() }
}

const documents: WorkspaceDocument[] = [
  document('prd', { features: [{ name: '反馈录入', rule: '运营可录入', acceptance: '保存后可查询' }] }),
  document('ux', { pages: [{ name: '反馈列表', entry: '主导航', task: '筛选反馈' }, { name: '反馈详情', entry: '列表行', task: '查看与编辑' }], states: '覆盖加载、空数据、失败和无权限。' }),
  document('technical', { security: '最小权限', performance: '列表分页', deployment: '四环境隔离', rollback: '回退上一版本' }),
  document('database', { tables: [{ table: 'feedback', field: 'id', type: 'TEXT', rule: '主键' }, { table: 'feedback', field: 'content', type: 'TEXT', rule: '非空' }] }),
  document('api', { endpoints: [{ method: 'GET', path: '/api/feedback', purpose: '查询反馈', permission: '运营' }, { method: 'POST', path: '/api/feedback', purpose: '新增反馈', permission: '运营' }] }),
  document('development', { tasks: [{ order: '1', task: '建立反馈模块', done: '架构校验通过' }] }),
  document('test', { cases: [{ requirement: '新增反馈', steps: '填写并提交', expected: '保存成功' }, { requirement: '权限拦截', steps: '无权限访问', expected: '返回禁止访问' }] }),
  document('release', { rollout: [{ group: '内部运营', duration: '30 分钟', threshold: '核心流程失败' }], monitoring: '错误率和成功率', rollback: '停止灰度并回退' }),
  document('changelog', { bugs: [{ issue: '重复提交', severity: '高', resolution: '增加幂等校验' }] }),
]

test('splits every interface, page, database field and test case into its own todo', () => {
  const result = buildTodoList(documents)
  const items = result.groups.flatMap((group) => group.items)
  assert.equal(items.filter((item) => item.category === 'api').length, 2)
  assert.equal(items.filter((item) => item.category === 'frontend').length, 2)
  assert.equal(items.filter((item) => item.category === 'data').length, 2)
  assert.equal(items.filter((item) => item.category === 'quality').length, 3)
  assert.match(items.find((item) => item.title.includes('POST /api/feedback'))?.acceptance ?? '', /自动化测试/)
  assert.equal(new Set(items.map((item) => item.id)).size, items.length)
})

test('renders a detailed markdown checklist with document sources', () => {
  const result = buildTodoList(documents)
  assert.match(result.markdown, /# 开发 TodoList/)
  assert.match(result.markdown, /- \[ \] \*\*API-002\*\* POST \/api\/feedback/)
  assert.match(result.markdown, /来源：API 接口 · 接口清单/)
})
