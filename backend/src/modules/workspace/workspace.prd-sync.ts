import type { DocumentType } from './workspace.schema'

type Content = Record<string, unknown>
type Row = Record<string, unknown>
type TechnicalType = Extract<DocumentType, 'technical' | 'database' | 'api' | 'development' | 'test' | 'release'>

export const technicalDocumentTypes: TechnicalType[] = ['technical', 'database', 'api', 'development', 'test', 'release']

const rows = (content: Content, field: string): Row[] => Array.isArray(content[field]) ? content[field] as Row[] : []
const text = (value: unknown, fallback: string) => typeof value === 'string' && value.trim() ? value.trim() : fallback
const safeId = (value: unknown, index: number) => {
  const id = text(value, `FEATURE-${String(index + 1).padStart(3, '0')}`).toLowerCase().replace(/[^a-z0-9-]/g, '-')
  return id.replace(/-+/g, '-').replace(/^-|-$/g, '') || `feature-${String(index + 1).padStart(3, '0')}`
}
const merge = (existing: Content | undefined, generated: Content): Content => ({ ...(existing ?? {}), ...generated })

export function buildTechnicalDocumentUpdates(prd: Content, current: Partial<Record<TechnicalType, Content>>) {
  const features = rows(prd, 'features')
  const flows = rows(prd, 'flows')
  const roles = rows(prd, 'roles')
  const dataNeeds = rows(prd, 'dataNeeds')
  const metrics = rows(prd, 'metrics')
  const edgeCases = rows(prd, 'edgeCases')
  const risks = rows(prd, 'risks')
  const goal = text(prd.goal, '实现 PRD 中已确认的业务目标')
  const scope = text(prd.scope, '按 PRD 当前版本范围交付')

  const technical = merge(current.technical, {
    summary: `围绕“${goal}”建设 Vue 3 前端与 NestJS 后端，技术边界以 PRD 的用户、功能、数据和验收规则为准。`,
    traceability: features.map((row, index) => ({ requirement: text(row.id, `REQ-${String(index + 1).padStart(3, '0')}`), module: safeId(row.id, index), implementation: `独立模块实现${text(row.name, '未命名功能')}`, verification: text(row.acceptance, '通过对应业务验收') })),
    drivers: [goal, scope, ...metrics.map((row) => `${text(row.metric, '业务指标')}达到${text(row.target, 'PRD 目标')}`)],
    constraints: [{ dimension: '业务范围', constraint: scope, impact: '仅实现已确认范围，新增需求先更新 PRD' }],
    systemContext: roles.map((row) => ({ participant: text(row.role, '业务用户'), interaction: text(row.allowed, '使用业务功能'), ownership: '项目团队', trust: text(row.scope, '按角色数据范围') })),
    layers: [
      { layer: '前端展示层', responsibility: '页面、组件和路由', allowed: '业务交互层', forbidden: '直接访问数据库' },
      { layer: '业务交互层', responsibility: '状态、校验和 API 客户端', allowed: '网关控制层', forbidden: '绕过 API 层' },
      { layer: '网关控制层', responsibility: '鉴权、日志和异常转换', allowed: '核心业务服务层', forbidden: '承载业务规则' },
      { layer: '核心业务服务层', responsibility: 'PRD 业务规则和状态变化', allowed: '数据存储层', forbidden: '直接处理页面状态' },
      { layer: '数据存储层', responsibility: '数据库、迁移和备份', allowed: '数据库接口', forbidden: '承载 HTTP 逻辑' },
    ],
    modules: features.map((row, index) => ({ module: safeId(row.id, index), responsibility: text(row.name, '业务功能'), input: 'Zod 请求契约', output: text(row.acceptance, '可验证业务结果'), dependencies: '公共鉴权、日志和数据接口', extension: '预留事件与第三方适配器' })),
    dependencyRules: '模块只通过公开接口协作；Controller 处理 HTTP，Service 处理业务规则，Repository 处理数据访问；前端只通过模块 API 层请求后端。',
    keyFlows: flows.map((row) => ({ flow: text(row.requirement, '业务流程'), trigger: text(row.trigger, '用户操作'), steps: text(row.mainFlow, '按 PRD 正常流程处理'), consistency: '关键写入使用事务并记录审计', failure: text(row.exceptions, '返回明确错误并保持数据一致') })),
    decisions: [{ id: 'ADR-001', status: '已确认', options: '按页面堆叠 / 按业务模块拆分', choice: '按业务模块拆分', reason: '与 PRD 需求编号保持可追溯', consequence: '每个模块需要独立契约和测试' }],
    apiStrategy: 'REST API 使用 /api 前缀，Zod 是请求响应契约来源，统一返回 code、data、message，列表强制分页。',
    dataStrategy: `业务数据来自 PRD 数据需求；写操作使用事务，敏感数据按等级控制。当前数据项：${dataNeeds.map((row) => text(row.data, '业务数据')).join('、') || '按实施阶段补充'}。`,
    qualityGoals: metrics.map((row) => ({ scenario: text(row.metric, '业务指标'), metric: text(row.metric, '指标'), target: text(row.target, 'PRD 目标'), verification: text(row.method, '上线后统计') })),
    securityModel: dataNeeds.map((row) => ({ asset: text(row.data, '业务数据'), threat: `${text(row.sensitivity, '普通')}数据泄露`, control: '最小权限、脱敏、参数校验和审计', verification: '权限与日志脱敏测试' })),
    authorization: roles.map((row) => ({ boundary: 'API 与页面入口', identity: text(row.role, '业务用户'), permission: text(row.allowed, '按 PRD 权限'), serverCheck: `后端校验；禁止：${text(row.forbidden, '越权操作')}` })),
    performance: metrics.map((row) => ({ scenario: text(row.metric, '核心流程'), scale: text(prd.expectedScale, '按项目预计规模'), target: text(row.target, '满足业务目标'), approach: '分页、索引、去重请求和必要缓存' })),
    resilience: edgeCases.map((row) => ({ failure: text(row.scenario, '业务异常'), timeout: '接口默认 10 秒', retry: '仅幂等请求有限重试', fallback: text(row.expected, '保持数据一致并提示'), alert: text(row.message, '记录请求编号') })),
    concurrency: '写接口使用幂等键或版本号防止重复提交；冲突时不覆盖新数据并提示刷新。',
    environments: ['开发', '测试', '预发', '生产'].map((environment) => ({ environment, purpose: `${environment}验证`, data: environment === '生产' ? '真实受控数据' : '脱敏数据', config: '独立环境变量和密钥', deployment: '前后端与数据库分层部署' })),
    observability: [{ signal: '错误率与接口延迟', fields: '请求编号、路由、耗时、状态码、用户 ID', threshold: '按上线方案配置', action: '告警、定位并按需回退' }],
    migrations: [{ change: 'PRD 数据字段变化', forward: '新增成对迁移并先在预发执行', backward: '保留旧字段兼容一个版本', rollback: '回退应用并执行安全回退脚本', verification: '迁移前后数据校验' }],
    releaseRollback: '按上线发布方案灰度；出现核心流程、权限或数据一致性问题时停止扩量并切回上一稳定版本。',
    risks: risks.map((row) => ({ risk: text(row.risk, 'PRD 风险'), trigger: text(row.signal, '出现风险信号'), prevention: text(row.response, '提前控制'), response: text(row.response, '止损并复盘') })),
    testStrategy: '每个 PRD 功能、规则、权限和异常场景均建立独立测试；上线前通过类型检查、lint、单元测试、构建和 UI 主流程验证。',
  })

  const database = merge(current.database, {
    entities: dataNeeds.map((row) => ({ name: safeId(row.data, 0), meaning: text(row.data, '业务数据'), retention: text(row.retention, '按业务政策') })),
    tables: dataNeeds.map((row, index) => ({ table: 'business_record', field: safeId(row.data, index).replace(/-/g, '_'), type: 'text', rule: `${text(row.sensitivity, '普通')}；来源：${text(row.source, '业务输入')}` })),
    relations: '业务对象以文本 ID 关联；删除默认使用逻辑删除；历史审计记录不得级联删除。',
    migration: 'SQLite 与 PostgreSQL 迁移成对；生产变更先备份、预发演练并验证回退。',
  })
  const api = merge(current.api, {
    conventions: '统一 /api 前缀、Zod 校验和 code/data/message 响应；列表分页；服务端执行权限检查；写接口支持幂等。',
    endpoints: features.map((row, index) => ({ method: 'POST', path: `/api/features/${safeId(row.id, index)}`, purpose: text(row.name, '业务功能'), permission: roles.map((role) => text(role.role, '')).filter(Boolean).join('、') || '已登录用户' })),
  })
  const development = merge(current.development, {
    stableVersion: 'PRD 当前确认版本', scope,
    tasks: features.map((row, index) => ({ order: String(index + 1), task: `实现${text(row.name, '业务功能')}`, done: text(row.acceptance, '通过对应验收') })),
    tests: '一个接口、页面、字段和测试用例对应一个 Todo；每项完成后运行项目验证脚本。',
  })
  const test = merge(current.test, {
    scope: `覆盖${scope}中的功能、权限、数据和异常流程。`,
    cases: features.map((row) => ({ requirement: text(row.id, 'PRD 需求'), steps: `执行${text(row.name, '业务功能')}的正常、异常和无权限流程`, expected: text(row.acceptance, '符合 PRD 验收标准') })),
    regression: edgeCases.map((row) => `${text(row.scenario, '异常场景')}：${text(row.expected, '按 PRD 处理')}`).join('；') || '覆盖空数据、重复提交、无权限、慢网络和多端布局。',
    releaseBlockers: '存在 P0/P1 缺陷、权限绕过、数据不一致或核心流程不可用时禁止发布。',
  })
  const release = merge(current.release, {
    version: 'PRD 当前确认版本', changes: features.map((row) => text(row.name, '业务功能')).join('、'),
    environment: '开发、测试、预发、生产环境隔离配置、数据和密钥。',
    rollout: [{ group: '内部管理员与业务代表', duration: '2 小时', threshold: '核心流程失败或数据错误立即停止' }, { group: '20% 用户', duration: '1 个工作日', threshold: '错误率或延迟超过阈值停止扩量' }],
  })
  return { technical, database, api, development, test, release }
}
