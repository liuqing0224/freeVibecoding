import { execFile } from 'node:child_process'
import { spawn } from 'node:child_process'
import { promisify } from 'node:util'
import { documentDefinitions } from './workspace.documents'
import { InterviewResponseSchema, ProjectInterviewResponseSchema, type CodingAgentId, type InterviewInput, type ProjectInterviewInput } from './workspace.schema'
import type { Workspace, WorkspaceDocument } from './workspace.types'

const exec = promisify(execFile)
const candidates: Record<CodingAgentId, { name: string; commands: string[] }> = {
  codex: { name: 'Codex', commands: ['/Applications/ChatGPT.app/Contents/Resources/codex', 'codex'] },
  claude: { name: 'Claude Code', commands: ['/Users/l/.local/bin/claude', 'claude'] },
}

async function locate(id: CodingAgentId) {
  for (const command of candidates[id].commands) {
    try {
      const { stdout } = await exec(command, ['--version'], { timeout: 5000 })
      return { command, version: stdout.trim().split('\n')[0] || '已安装' }
    } catch { /* try the next approved command */ }
  }
  return null
}

export async function scanCodingAgents() {
  return Promise.all((Object.keys(candidates) as CodingAgentId[]).map(async (id) => {
    const found = await locate(id)
    return { id, name: candidates[id].name, available: Boolean(found), version: found?.version ?? null, path: found?.command ?? null }
  }))
}

function promptFor(project: Workspace, documents: WorkspaceDocument[], input: InterviewInput) {
  const allowedFields = Object.fromEntries(documentDefinitions.map((definition) => [definition.type, definition.fields.map((field) => field.id)]))
  const shorten = (value: unknown): unknown => {
    if (typeof value === 'string') return value.length > 800 ? `${value.slice(0, 800)}…` : value
    if (Array.isArray(value)) return value.slice(0, 20).map(shorten)
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, shorten(item)]))
    return value
  }
  const documentState = Object.fromEntries(documents.map((document) => [document.type, shorten(document.content)]))
  return `你是面向非研发人员的产研需求访谈助手。只讨论业务并输出 JSON，不执行命令、不修改文件。\n\n项目：${JSON.stringify(project)}\n允许修改的文档字段：${JSON.stringify(allowedFields)}\n当前正式文档：${JSON.stringify(documentState)}\n访谈临时文档（这是后续对话的首要上下文）：\n${input.workingDocument || '# 访谈临时文档\n\n暂无内容'}\n历史对话：${JSON.stringify(input.history)}\n用户本轮输入：${input.message}\n\n每轮最多追问 3 个非技术问题，问题必须直接对应临时文档中的已有事实或待确认项。不要只抛开放问题：把 2–5 个具体、互斥、非技术选项直接写进每个问题文本，使用“A. …；B. …；C. …；也可以补充其他情况”的自然对话格式。选项要根据临时文档中的项目背景生成，不能使用与当前项目无关的通用问题。先依据本轮沟通更新 workingDocument Markdown，分为“已确认信息、业务范围、关键规则、待确认问题”，去重并保留旧结论；已经能确定的正式内容写入 patches，不确定内容不要猜测。严格只输出以下 JSON，不要 Markdown：\n{"reply":"给用户的简明回复","questions":["结合临时文档中已确认的多渠道反馈，首版采用哪种汇集方式？A. 运营手动录入；B. 上传表格导入；C. 直接对接现有系统；也可以补充其他方式。"],"patches":[{"documentType":"prd","fields":{"goal":"新值"}}],"workingDocument":"# 访谈临时文档\\n\\n## 已确认信息\\n..."}`
}

function parseAgentJson(output: string) {
  const fenced = output.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]
  const start = output.indexOf('{'); const end = output.lastIndexOf('}')
  const candidate = fenced ?? (start >= 0 && end > start ? output.slice(start, end + 1) : output)
  return InterviewResponseSchema.parse(JSON.parse(candidate))
}

export function sanitizeInterviewResponse(output: string) {
  const parsed = parseAgentJson(output)
  const fieldMap = new Map(documentDefinitions.map((definition) => [definition.type, new Set(definition.fields.map((field) => field.id))]))
  return { ...parsed, patches: parsed.patches.map((patch) => ({ ...patch, fields: Object.fromEntries(Object.entries(patch.fields).filter(([key]) => fieldMap.get(patch.documentType)?.has(key))) })).filter((patch) => Object.keys(patch.fields).length > 0) }
}

export function sanitizeProjectInterviewResponse(output: string) {
  const fenced = output.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]
  const start = output.indexOf('{'); const end = output.lastIndexOf('}')
  const raw = JSON.parse(fenced ?? output.slice(start, end + 1)) as { projectDraft?: Record<string, unknown> }
  const draft = raw.projectDraft ?? {}
  for (const key of ['name', 'slug', 'summary', 'targetUsers', 'painPoints', 'successMetric', 'expectedScale']) {
    if (Array.isArray(draft[key])) draft[key] = draft[key].map(String).join('、')
  }
  for (const key of ['presets', 'mustHave', 'excluded', 'roles', 'devices', 'integrations']) {
    if (typeof draft[key] === 'string') draft[key] = [draft[key]]
  }
  const limits: Record<string, number> = { presets: 3, mustHave: 8, excluded: 8, roles: 12, integrations: 12 }
  for (const [key, limit] of Object.entries(limits)) {
    if (Array.isArray(draft[key])) draft[key] = [...new Set(draft[key].map(String).filter(Boolean))].slice(0, limit)
  }
  raw.projectDraft = draft
  return ProjectInterviewResponseSchema.parse(raw)
}

function runWithInput(command: string, args: string[], input: string) {
  return new Promise<string>((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['pipe', 'pipe', 'pipe'] })
    let stdout = ''; let stderr = ''; let settled = false
    const timer = setTimeout(() => { child.kill('SIGTERM'); if (!settled) { settled = true; reject(new Error('Coding Agent 响应超时，请稍后重试或切换其他 Agent')) } }, 90000)
    child.stdout.setEncoding('utf8'); child.stderr.setEncoding('utf8')
    child.stdout.on('data', (chunk: string) => { stdout += chunk })
    child.stderr.on('data', (chunk: string) => { stderr += chunk })
    child.on('error', reject)
    child.on('close', (code) => {
      if (settled) return
      settled = true; clearTimeout(timer)
      if (code === 0) resolve(stdout)
      else reject(new Error(stderr.trim().split('\n').pop() || `Coding Agent 调用失败（${code}）`))
    })
    child.stdin.end(input)
  })
}

export async function runInterview(project: Workspace, documents: WorkspaceDocument[], input: InterviewInput) {
  const found = await locate(input.agentId)
  if (!found) throw new Error('所选 Coding Agent 未安装或当前不可用')
  const prompt = promptFor(project, documents, input)
  if (input.agentId === 'codex') {
    const stdout = await runWithInput(found.command, ['exec', '--ephemeral', '--sandbox', 'read-only', '--skip-git-repo-check', '--color', 'never', '-'], prompt)
    const result = sanitizeInterviewResponse(stdout)
    return { ...result, workingDocument: result.workingDocument || input.workingDocument }
  }
  const stdout = await runWithInput(found.command, ['--print', '--output-format', 'json', '--tools', '', '--no-session-persistence'], prompt)
  const envelope = JSON.parse(stdout) as { result?: string }
  const result = sanitizeInterviewResponse(envelope.result ?? stdout)
  return { ...result, workingDocument: result.workingDocument || input.workingDocument }
}

export async function runProjectInterview(input: ProjectInterviewInput) {
  const found = await locate(input.agentId)
  if (!found) throw new Error('所选 Coding Agent 未安装或当前不可用')
  const prompt = `你是面向零研发基础用户的项目建项访谈助手。只用业务语言提问，不执行命令、不修改文件。\n\n当前项目草稿：${JSON.stringify(input.draft)}\n访谈临时文档（这是后续对话的首要上下文）：\n${input.workingDocument || '# 建项访谈临时文档\n\n暂无内容'}\n历史对话：${JSON.stringify(input.history)}\n用户本轮输入：${input.message}\n\n目标是逐轮整理这些字段：name、slug（小写英文数字连字符）、presets（admin/website/tool，可多选）、summary、deliveryTier（默认 business）、targetUsers、painPoints、successMetric、mustHave、excluded、roles、dataSensitivity（none/normal/personal/sensitive）、devices（desktop/mobile）、expectedScale、integrations。每轮最多问 3 个最关键的非技术问题，必须基于临时文档中已经记录的背景或待确认项。不要只抛开放问题：把 2–5 个具体、互斥、易懂的选项直接写进每个问题文本，使用“A. …；B. …；C. …；也可以补充其他情况”的自然对话格式。选项必须结合临时文档中的当前项目、用户、范围或待确认事项生成。已确定内容合并进 projectDraft，不确定的不要猜。先更新 workingDocument Markdown，按“项目目标、用户与场景、首版范围、约束与边界、待确认问题”整理并保留旧结论。严格只输出 JSON：\n{"reply":"简短回应","questions":["根据临时文档中已记录的客户反馈来源，首版希望怎样汇集反馈？A. 运营手动录入；B. 上传表格导入；C. 自动对接现有系统；也可以补充其他方式。"],"projectDraft":{"name":"项目名","presets":["admin"],"deliveryTier":"business"},"workingDocument":"# 建项访谈临时文档\\n\\n## 项目目标\\n..."}`
  let stdout: string
  if (input.agentId === 'codex') stdout = await runWithInput(found.command, ['exec', '--ephemeral', '--sandbox', 'read-only', '--skip-git-repo-check', '--color', 'never', '-'], prompt)
  else {
    const envelope = JSON.parse(await runWithInput(found.command, ['--print', '--output-format', 'json', '--tools', '', '--no-session-persistence'], prompt)) as { result?: string }
    stdout = envelope.result ?? ''
  }
  const result = sanitizeProjectInterviewResponse(stdout)
  return { ...result, workingDocument: result.workingDocument || input.workingDocument }
}
