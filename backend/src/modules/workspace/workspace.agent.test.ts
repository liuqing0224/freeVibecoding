import assert from 'node:assert/strict'
import test from 'node:test'
import { sanitizeInterviewResponse, sanitizeProjectInterviewResponse } from './workspace.agent'

test('keeps only known document fields from agent output', () => {
  const result = sanitizeInterviewResponse(JSON.stringify({
    reply: '已整理目标。', questions: ['还需要哪些角色？'],
    patches: [{ documentType: 'prd', fields: { goal: '减少人工整理时间', unknown: 'discard' } }],
  }))
  assert.deepEqual(result.patches, [{ documentType: 'prd', fields: { goal: '减少人工整理时间' } }])
})

test('accepts JSON returned inside a markdown fence', () => {
  const result = sanitizeInterviewResponse('```json\n{"reply":"继续","questions":[],"patches":[],"workingDocument":"# 访谈临时文档\\n\\n## 已确认信息"}\n```')
  assert.equal(result.reply, '继续')
  assert.match(result.workingDocument, /已确认信息/)
})

test('accepts an incomplete project draft during creation interview', () => {
  const result = sanitizeProjectInterviewResponse(JSON.stringify({ reply: '先确认用户。', questions: ['谁会使用？'], projectDraft: { name: '客户反馈台', presets: 'admin', targetUsers: ['运营', '客服'], deliveryTier: 'business' }, workingDocument: '# 建项访谈临时文档' }))
  assert.equal(result.projectDraft.name, '客户反馈台')
  assert.deepEqual(result.projectDraft.presets, ['admin'])
  assert.equal(result.projectDraft.targetUsers, '运营、客服')
  assert.equal(result.workingDocument, '# 建项访谈临时文档')
})

test('caps agent-generated project lists at the product limits', () => {
  const result = sanitizeProjectInterviewResponse(JSON.stringify({
    reply: '已整理首版范围。', questions: [],
    projectDraft: {
      mustHave: Array.from({ length: 11 }, (_, index) => `功能${index + 1}`),
      excluded: Array.from({ length: 10 }, (_, index) => `暂不做${index + 1}`),
      roles: Array.from({ length: 15 }, (_, index) => `角色${index + 1}`),
      integrations: Array.from({ length: 14 }, (_, index) => `系统${index + 1}`),
      presets: ['admin', 'website', 'tool', 'admin'],
    },
  }))
  assert.equal(result.projectDraft.mustHave?.length, 8)
  assert.equal(result.projectDraft.excluded?.length, 8)
  assert.equal(result.projectDraft.roles?.length, 12)
  assert.equal(result.projectDraft.integrations?.length, 12)
  assert.deepEqual(result.projectDraft.presets, ['admin', 'website', 'tool'])
})
