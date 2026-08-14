import type { DocumentType } from './workspace.schema'
import type { DocumentField } from './workspace.document-definitions'
import { documentDefinitions } from './workspace.document-definitions'

export { documentDefinitions, presetDefinitions } from './workspace.document-definitions'
export { initialDocuments } from './workspace.document-defaults'

function scalarPresent(value: unknown): boolean {
  if (typeof value !== 'string') return value !== undefined && value !== null
  const normalized = value.trim()
  return normalized.length > 0 && normalized !== '待确认' && !normalized.startsWith('待确认：')
}

export function fieldValuePresent(field: DocumentField, value: unknown): boolean {
  if (!Array.isArray(value)) return scalarPresent(value)
  if (value.length === 0) return false
  if (field.type !== 'table') return value.every((item) => scalarPresent(item))
  const columns = field.columns ?? []
  return value.every((row) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return false
    return columns.every((column) => scalarPresent((row as Record<string, unknown>)[column.id]))
  })
}

export function documentCompleteness(type: DocumentType, content: Record<string, unknown>): number {
  const definition = documentDefinitions.find((item) => item.type === type)!
  const required = definition.fields.filter((field) => field.required)
  return Math.round((required.filter((field) => fieldValuePresent(field, content[field.id])).length / required.length) * 100)
}

export function missingRequiredFields(type: DocumentType, content: Record<string, unknown>) {
  const definition = documentDefinitions.find((item) => item.type === type)!
  return definition.fields.filter((field) => field.required && !fieldValuePresent(field, content[field.id]))
}

export function renderMarkdown(type: DocumentType, content: Record<string, unknown>): string {
  const definition = documentDefinitions.find((item) => item.type === type)!
  const lines = [`# ${definition.title}`, '', definition.description, '']
  let activeGroup = ''
  for (const field of definition.fields) {
    if (field.group && field.group !== activeGroup) { activeGroup = field.group; lines.push(`## ${activeGroup}`, '') }
    lines.push(`${field.group ? '###' : '##'} ${field.label}`, '')
    const value = content[field.id]
    if (field.type === 'table' && Array.isArray(value)) renderTable(lines, field, value)
    else if (Array.isArray(value)) value.forEach((item) => lines.push(`- ${String(item)}`))
    else lines.push(String(value ?? '待填写'))
    lines.push('')
  }
  return lines.join('\n')
}

function renderTable(lines: string[], field: DocumentField, value: unknown[]) {
  const columns = field.columns ?? []
  lines.push(`| ${columns.map((column) => column.label).join(' | ')} |`)
  lines.push(`| ${columns.map(() => '---').join(' | ')} |`)
  for (const row of value as Array<Record<string, unknown>>) {
    lines.push(`| ${columns.map((column) => escapeCell(row[column.id])).join(' | ')} |`)
  }
}

function escapeCell(value: unknown) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>')
}
