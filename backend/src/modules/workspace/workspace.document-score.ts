import type { DocumentField } from './workspace.document-definitions'
import { documentDefinitions } from './workspace.document-definitions'
import { documentCompleteness, fieldValuePresent } from './workspace.documents'
import type { DocumentType } from './workspace.schema'

interface Dimension { label: string; score: number; maxScore: number }
export interface DocumentQuality { score: number; level: '待补充' | '待完善' | '合格' | '良好' | '优秀'; dimensions: Dimension[]; suggestions: string[] }

function valueText(value: unknown): string {
  if (Array.isArray(value)) return value.map(valueText).join(' ')
  if (value && typeof value === 'object') return Object.values(value).map(valueText).join(' ')
  return String(value ?? '').trim()
}

function meaningfulText(value: unknown): string {
  const text = valueText(value)
  if (text.includes('已确认：详细规则与验收标准见本页 Markdown 正文')) return ''
  if (text.includes('已确认：') && text.includes('按业务规则完成处理并提供可验证结果')) return ''
  return text
}

function detailThreshold(field: DocumentField) {
  if (field.type === 'textarea') return 30
  if (field.type === 'text') return 12
  if (field.type === 'checklist') return 10
  return 8
}

function structuredDensity(field: DocumentField, value: unknown): number {
  if (!['table', 'checklist', 'multiselect'].includes(field.type)) return 1
  if (!Array.isArray(value) || value.length === 0) return 0
  if (field.type !== 'table') return value.filter((item) => valueText(item).length > 0).length / value.length
  const columns = field.columns ?? []
  const cells = value.flatMap((row) => columns.map((column) => valueText((row as Record<string, unknown>)?.[column.id])))
  return cells.length ? cells.filter(Boolean).length / cells.length : 0
}

function levelFor(score: number): DocumentQuality['level'] {
  if (score < 40) return '待补充'
  if (score < 60) return '待完善'
  if (score < 75) return '合格'
  if (score < 90) return '良好'
  return '优秀'
}

export function scoreDocument(type: DocumentType, content: Record<string, unknown>, markdown: string): DocumentQuality {
  const definition = documentDefinitions.find((item) => item.type === type)!
  const required = definition.fields.filter((field) => field.required)
  const present = required.filter((field) => fieldValuePresent(field, content[field.id]))
  const coverage = Math.round(documentCompleteness(type, content) * 0.4)
  const detailed = present.filter((field) => meaningfulText(content[field.id]).length >= detailThreshold(field)).length
  const detail = required.length ? Math.round(detailed / required.length * 25) : 25
  const structured = required.filter((field) => ['table', 'checklist', 'multiselect'].includes(field.type))
  const density = structured.length ? structured.reduce((sum, field) => sum + structuredDensity(field, content[field.id]), 0) / structured.length : 1
  const structure = Math.round(density * 20)
  const actionableFields = present.filter((field) => meaningfulText(content[field.id]).length >= detailThreshold(field) * 1.5).length
  const markdownBonus = markdown.trim().length >= 300 ? 0.1 : 0
  const actionability = required.length ? Math.min(15, Math.round((actionableFields / required.length + markdownBonus) * 15)) : 15
  const score = Math.min(100, coverage + detail + structure + actionability)
  const suggestions: string[] = []
  for (const field of required.filter((item) => !fieldValuePresent(item, content[item.id])).slice(0, 3)) suggestions.push(`补充“${field.label}”的有效内容`)
  for (const field of present.filter((item) => meaningfulText(content[item.id]).length < detailThreshold(item)).slice(0, 2)) suggestions.push(`让“${field.label}”更具体，写清对象、规则、边界或验证结果`)
  if (density < 0.8) suggestions.push('补齐清单或表格中的空白项，确保每一列都可直接执行')
  if (!suggestions.length && score < 90) suggestions.push('继续补充量化指标、异常处理和可验证的完成标准')
  return { score, level: levelFor(score), dimensions: [
    { label: '必填覆盖', score: coverage, maxScore: 40 },
    { label: '内容具体', score: detail, maxScore: 25 },
    { label: '结构完整', score: structure, maxScore: 20 },
    { label: '可执行性', score: actionability, maxScore: 15 },
  ], suggestions }
}
