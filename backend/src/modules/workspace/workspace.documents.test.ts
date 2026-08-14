import assert from 'node:assert/strict'
import test from 'node:test'
import { documentCompleteness, documentDefinitions, fieldValuePresent, initialDocuments, renderMarkdown } from './workspace.documents'
import { DocumentUpdateSchema, type ProjectCreateInput } from './workspace.schema'

const input: ProjectCreateInput = {
  name: '客户洞察', slug: 'customer-insight', presets: ['admin', 'website', 'tool'], summary: '帮助运营快速整理客户反馈并形成可追踪结论。', deliveryTier: 'business',
  targetUsers: '运营人员', painPoints: '反馈散落在多个渠道，整理耗时且容易遗漏。', successMetric: '每周整理时间从四小时降到一小时',
  mustHave: ['录入反馈', '生成分类结果'], excluded: ['自动外呼'], roles: ['运营人员'], dataSensitivity: 'normal', devices: ['desktop'], expectedScale: '100 名用户', integrations: [],
}

test('initializes every product document from the project brief', () => {
  const documents = initialDocuments(input)
  assert.deepEqual(Object.keys(documents).sort(), ['api', 'changelog', 'database', 'development', 'prd', 'release', 'technical', 'test', 'ux'])
  assert.equal(documents.prd.targetUsers, '运营人员')
  assert.equal(Array.isArray(documents.prd.userScenarios), true)
  assert.match(String(documents.technical.summary), /Vue 3/)
  assert.match(String(documents.technical.summary), /后台管理、官网 \/ H5、业务工具/)
  assert.equal(Array.isArray(documents.technical.decisions), true)
  assert.equal(Array.isArray(documents.technical.qualityGoals), true)
})

test('calculates completeness from required fields', () => {
  assert.equal(documentCompleteness('prd', {}), 0)
  const complete = initialDocuments(input).technical
  assert.equal(documentCompleteness('technical', complete), 100)
  const featureField = documentDefinitions.find((item) => item.type === 'prd')!.fields.find((field) => field.id === 'features')!
  assert.equal(fieldValuePresent(featureField, [{ id: 'REQ-001', name: '待确认', priority: '', userValue: '', acceptance: '' }]), false)
})

test('renders table and checklist content as markdown', () => {
  const markdown = renderMarkdown('prd', initialDocuments(input).prd)
  assert.match(markdown, /# PRD 产品需求/)
  assert.match(markdown, /- 录入反馈/)
  assert.match(markdown, /\| 需求编号 \| 优先级 \| 功能 \| 用户价值 \| 完成标准 \|/)
  assert.match(markdown, /需求编号/)
  assert.match(markdown, /异常与边界场景/)
  assert.match(markdown, /待确认问题/)
})

test('includes implementation-grade PRD and technical sections', () => {
  const prd = documentDefinitions.find((item) => item.type === 'prd')!
  const technical = documentDefinitions.find((item) => item.type === 'technical')!
  for (const id of ['personas', 'userScenarios', 'metrics', 'features', 'flows', 'businessRules', 'stateRules', 'edgeCases', 'risks']) assert.ok(prd.fields.some((field) => field.id === id), `missing PRD field ${id}`)
  for (const id of ['traceability', 'constraints', 'systemContext', 'layers', 'modules', 'keyFlows', 'decisions', 'securityModel', 'resilience', 'observability', 'migrations']) assert.ok(technical.fields.some((field) => field.id === id), `missing technical field ${id}`)
})

test('accepts either structured content or editable markdown updates', () => {
  assert.deepEqual(DocumentUpdateSchema.parse({ markdown: '# 自定义 PRD' }), { markdown: '# 自定义 PRD' })
  assert.deepEqual(DocumentUpdateSchema.parse({ content: { goal: '新目标' } }), { content: { goal: '新目标' } })
  assert.throws(() => DocumentUpdateSchema.parse({}), /provide content or markdown/i)
})
