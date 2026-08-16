import assert from 'node:assert/strict'
import test from 'node:test'
import { scoreDocument } from './workspace.document-score'
import { documentDefinitions } from './workspace.documents'

test('scores vague and incomplete content conservatively', () => {
  const result = scoreDocument('prd', { productGoal: '待确认' }, '# PRD\n\n待确认')

  assert.ok(result.score < 30)
  assert.equal(result.level, '待补充')
  assert.ok(result.suggestions.some((item) => item.includes('产品目标')))
})

test('rewards complete, detailed and structured document content', () => {
  const definition = documentDefinitions.find((item) => item.type === 'prd')!
  const content = Object.fromEntries(definition.fields.map((field) => {
    if (field.type === 'table') return [field.id, [Object.fromEntries((field.columns ?? []).map((column) => [column.id, `${column.label}的明确业务内容`]))]]
    if (field.type === 'checklist') return [field.id, ['包含对象、规则、边界和可验证结果的具体条目']]
    return [field.id, '面向运营负责人，解决反馈分散和遗漏问题，并通过明确规则、异常处理及量化指标验证业务结果。']
  }))
  const result = scoreDocument('prd', content, '# PRD\n\n' + JSON.stringify(content))

  assert.ok(result.score >= 80)
  assert.ok(['良好', '优秀'].includes(result.level))
  assert.equal(result.dimensions.length, 4)
})

test('suggests strengthening short required fields', () => {
  const result = scoreDocument('technical', { summary: 'Vue', architecture: '五层' }, '# 技术方案\n\nVue')

  assert.ok(result.suggestions.some((item) => item.includes('具体')))
  assert.ok(result.dimensions.every((item) => item.score <= item.maxScore))
})

test('does not reward long generic confirmation placeholders as detailed content', () => {
  const placeholder = '已确认：详细规则与验收标准见本页 Markdown 正文。'
  const result = scoreDocument('development', { stableVersion: placeholder, scope: placeholder, tasks: [{ order: placeholder, task: placeholder, done: placeholder }], tests: placeholder }, placeholder.repeat(20))

  assert.ok(result.dimensions.find((item) => item.label === '内容具体')!.score < 10)
  assert.ok(result.suggestions.some((item) => item.includes('更具体')))
})
