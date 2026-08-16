import assert from 'node:assert/strict'
import test from 'node:test'
import { buildTechnicalDocumentUpdates, technicalDocumentTypes } from './workspace.prd-sync'

const prd = {
  goal: '统一管理客户反馈',
  targetUsers: '运营人员和运营主管',
  scope: 'V1 后台管理系统',
  features: [
    { id: 'REQ-001', priority: 'P0', name: '录入反馈', userValue: '统一收集', acceptance: '生成唯一编号' },
    { id: 'REQ-002', priority: 'P0', name: '查询反馈', userValue: '快速定位', acceptance: '支持筛选分页' },
  ],
  flows: [{ requirement: 'REQ-001', precondition: '已登录', trigger: '点击新建', mainFlow: '填写并保存', exceptions: '校验失败时提示' }],
  roles: [{ role: '运营主管', scope: '全部反馈', allowed: '分派和关闭', forbidden: '修改系统配置' }],
  dataNeeds: [{ data: '客户联系方式', source: '用户录入', purpose: '后续联系', sensitivity: '个人信息', retention: '两年' }],
  metrics: [{ metric: '首次分派率', baseline: '待采集', target: '90%', method: '按周统计' }],
  edgeCases: [{ scenario: '重复提交', expected: '返回首次结果', message: '请勿重复提交' }],
  risks: [{ risk: '敏感信息泄露', signal: '日志出现联系方式', response: '立即脱敏并审计' }],
}

test('builds every technical document from structured PRD facts', () => {
  const updates = buildTechnicalDocumentUpdates(prd, {})
  const traceability = updates.technical.traceability as Array<Record<string, string>>
  const endpoints = updates.api.endpoints as Array<Record<string, string>>
  const tasks = updates.development.tasks as Array<Record<string, string>>
  const cases = updates.test.cases as Array<Record<string, string>>
  assert.deepEqual(Object.keys(updates), technicalDocumentTypes)
  assert.equal(traceability[0].requirement, 'REQ-001')
  assert.equal(endpoints.length, 2)
  assert.equal(tasks[1].task, '实现查询反馈')
  assert.equal(cases[0].expected, '生成唯一编号')
})

test('preserves manually maintained fields outside the PRD mapping', () => {
  const updates = buildTechnicalDocumentUpdates(prd, {
    api: { errors: '保留人工维护的错误码' },
    release: { monitoring: '保留人工维护的监控阈值' },
  })
  assert.equal(updates.api.errors, '保留人工维护的错误码')
  assert.equal(updates.release.monitoring, '保留人工维护的监控阈值')
})

test('uses safe deterministic paths when requirement ids are incomplete', () => {
  const updates = buildTechnicalDocumentUpdates({ ...prd, features: [{ name: '新功能' }] }, {})
  const endpoints = updates.api.endpoints as Array<Record<string, string>>
  assert.equal(endpoints[0].path, '/api/features/feature-001')
})
