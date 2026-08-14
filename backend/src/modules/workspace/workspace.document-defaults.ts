import type { DocumentType, ProjectCreateInput } from './workspace.schema'
import { presetDefinitions } from './workspace.document-definitions'

export function initialDocuments(input: ProjectCreateInput): Record<DocumentType, Record<string, unknown>> {
  const presets = presetDefinitions.filter((item) => input.presets.includes(item.id)); const presetNames = presets.map((item) => item.name).join('、')
  const requirements = input.mustHave.map((name, index) => ({ id: `REQ-${String(index + 1).padStart(3, '0')}`, priority: index < 3 ? 'P0' : 'P1', name, userValue: `帮助${input.targetUsers}完成${name}`, acceptance: `用户可以完成${name}，成功与失败结果均有明确提示` }))
  return {
    prd: {
      goal: input.summary, background: input.painPoints, objectives: [input.successMetric], nonGoals: input.excluded,
      targetUsers: input.targetUsers, personas: input.roles.map((role) => ({ role, goal: '高效完成核心业务任务', pain: input.painPoints, ability: '可使用常见网页或移动端工具' })),
      userScenarios: input.roles.map((role, index) => ({ id: `SCN-${String(index + 1).padStart(3, '0')}`, role, trigger: '需要处理核心业务时', task: input.mustHave.join('、'), result: input.successMetric })),
      metrics: [{ metric: input.successMetric, baseline: '上线前采集', target: input.successMetric, method: '通过业务记录与用户反馈统计' }],
      scope: `${input.deliveryTier}档交付；覆盖${presetNames}；目标设备为${input.devices.join('、')}。`, mustHave: input.mustHave, excluded: input.excluded.length ? input.excluded : ['首版范围之外的扩展能力'],
      features: requirements,
      flows: requirements.map((item) => ({ requirement: item.id, precondition: '用户已进入对应入口并具备权限', trigger: `用户发起${item.name}`, mainFlow: '输入或选择信息 → 系统校验 → 执行业务规则 → 保存结果 → 返回成功状态', exceptions: '输入无效、无权限、重复提交或服务失败时不产生错误数据，并给出可操作提示' })),
      businessRules: [{ id: 'RULE-001', condition: '所有写操作', rule: '服务端校验权限和输入；重复提交必须可识别', result: '合法请求执行一次，非法请求不修改数据' }],
      stateRules: [{ object: '核心业务对象', from: '初始', event: '用户完成有效操作', to: '已处理', forbidden: '无权限、输入无效或前置状态不满足时禁止变化' }],
      roles: input.roles.map((role) => ({ role, scope: '仅访问被授权的数据', allowed: '执行角色对应的业务操作', forbidden: '访问或修改未授权数据' })),
      dataNeeds: [{ data: '核心业务数据', source: '用户输入或第三方接口', purpose: '完成首版业务流程', sensitivity: input.dataSensitivity, retention: '按业务与合规要求确认' }],
      notifications: [],
      edgeCases: [
        { scenario: '没有数据', expected: '显示空状态和下一步入口', message: '暂无数据' },
        { scenario: '重复提交', expected: '只处理一次且不产生重复数据', message: '操作已处理，请勿重复提交' },
        { scenario: '无权限', expected: '后端拒绝操作并记录审计信息', message: '你没有执行此操作的权限' },
        { scenario: '网络或第三方失败', expected: '不丢失已输入内容，可重试或稍后处理', message: '暂时无法完成，请稍后重试' },
      ],
      dependencies: input.integrations, assumptions: [`预计规模：${input.expectedScale}`, `目标设备：${input.devices.join('、')}`],
      risks: [{ risk: '业务规则仍有未确认项', signal: '验收结果无法唯一判断', response: '开发前通过访谈补齐规则、异常与验收标准' }], openQuestions: [],
    },
    ux: { devices: input.devices.join('、'), navigation: `${presetNames}组合信息架构，按不同使用入口拆分导航与页面。`, pages: [], states: '覆盖加载、空数据、成功、失败和无权限状态。', forms: '危险操作二次确认，所有输入提供清晰校验。' },
    technical: technicalDefaults(input, presets, requirements),
    database: { entities: [], tables: [], relations: '按业务对象设计，一对多使用外键，多对多使用中间表。', migration: 'SQLite/PostgreSQL 迁移成对，正式执行前备份并验证回退。' },
    api: { conventions: '路径统一 /api/<module>，响应统一 { code, data, message }，服务端使用 zod 校验。', endpoints: [], errors: '4xx 表示输入或权限问题，5xx 记录追踪日志并提供用户可理解提示。' },
    development: { stableVersion: 'v0.0.0', scope: input.mustHave.join('、'), tasks: [], tests: '主流程、空数据、错误输入、重复提交、权限、失败和回归。', risks: '' },
    test: { scope: `${presetNames}，${input.devices.join('、')}，使用脱敏测试数据。`, cases: [], regression: '覆盖异常、权限、慢网络、刷新、多端和相关旧功能。', releaseBlockers: '数据丢失、越权、核心流程失败、敏感信息泄露、无法回退。' },
    release: { version: 'v1.0.0', changes: input.mustHave.join('、'), environment: '开发 / 测试 / 预发 / 生产四套环境。', rollout: [{ group: '内部账号', duration: '30 分钟', threshold: '核心流程失败' }, { group: '5% → 20% → 50% → 100%', duration: '每档至少 1 小时', threshold: '错误率或投诉超过阈值' }], monitoring: '错误率、响应时间、核心业务成功率和用户反馈。', rollback: '停止灰度，回退至上一 Git 标签，按方案恢复数据库并验证。' },
    changelog: { versions: [], requests: [], bugs: [], review: '上线后根据成功指标、问题和成本决定下一版本。' },
  }
}

function technicalDefaults(input: ProjectCreateInput, presets: typeof presetDefinitions, requirements: Array<{ id: string; name: string }>) {
  return {
    summary: `采用 Vue 3 + NestJS 的模块化单体方案，支持${presets.map((item) => item.name).join('、')}，本地 SQLite、生产 PostgreSQL。`,
    traceability: requirements.map((item) => ({ requirement: item.id, module: item.name, implementation: '前端闭环模块 + NestJS 业务模块 + 数据 Repository', verification: `按 PRD 验收标准验证${item.name}` })),
    drivers: ['非研发人员可持续维护', '模块边界清晰', '可验证、可回退', '源文件不超过 300 行'],
    constraints: [{ dimension: '交付与规模', constraint: `${input.deliveryTier}档，${input.expectedScale}`, impact: '优先模块化单体，避免不必要的分布式复杂度' }, { dimension: '终端', constraint: input.devices.join('、'), impact: '前端布局、交互和兼容测试覆盖目标设备' }],
    systemContext: [{ participant: input.targetUsers, interaction: '通过前端页面完成业务操作', ownership: '本项目', trust: '所有输入均不可信，服务端重新校验' }, ...input.integrations.map((system) => ({ participant: system, interaction: '通过独立适配模块调用', ownership: '第三方', trust: '外部信任边界，必须鉴权、超时和降级' }))],
    layers: [
      { layer: '前端展示层', responsibility: '页面、路由、视觉和设备适配', allowed: '业务交互层', forbidden: '直接访问后端或数据库' },
      { layer: '业务交互层', responsibility: '状态、表单校验和模块 API', allowed: '网关控制层', forbidden: '实现服务端核心规则' },
      { layer: '网关控制层', responsibility: '路由、鉴权、参数校验和统一响应', allowed: '核心业务服务层', forbidden: '直接写数据库' },
      { layer: '核心业务服务层', responsibility: '业务规则、状态变化和事务编排', allowed: '数据存储层', forbidden: '依赖页面实现' },
      { layer: '数据存储层', responsibility: 'Repository、数据库、缓存和文件', allowed: '数据库适配器', forbidden: '承载业务决策' },
    ],
    modules: requirements.map((item) => ({ module: item.name, responsibility: `完成${item.name}相关业务`, input: '已校验的请求', output: '统一业务结果', dependencies: '公共鉴权、日志和数据库接口', extension: '通过模块公开接口扩展' })),
    dependencyRules: '模块内部遵循 Controller → Service → Repository；业务模块不直接互相导入，共享能力提升到 common/database；前端 View → Store → API 单向调用。',
    keyFlows: requirements.map((item) => ({ flow: item.name, trigger: `用户发起${item.name}`, steps: '前端校验 → API → 鉴权与 Zod 校验 → Service 规则 → Repository 事务 → 统一响应', consistency: '写操作成功后数据与响应一致，失败全部回滚', failure: '返回可理解错误、记录追踪信息且不产生部分数据' })),
    integrations: input.integrations.map((system) => ({ system, direction: '本系统调用第三方', protocol: 'HTTPS API', auth: '密钥仅存环境变量', timeout: '5 秒', fallback: '停止重试并提示稍后处理' })),
    decisions: [{ id: 'ADR-001', status: '已决定', options: '模块化单体 / 微服务', choice: '模块化单体', reason: '当前规模交付与维护成本更低', consequence: '必须保持模块边界，未来才能独立拆分' }, { id: 'ADR-002', status: '已决定', options: 'Fastify / NestJS', choice: 'NestJS', reason: '模块、依赖注入和工程约束更适合长期迭代', consequence: '需遵守 Module/Controller/Service/Repository 分层' }],
    apiStrategy: 'REST 路径统一 /api/<module>；Zod 是输入输出契约；响应统一 { code, data, message }；列表统一分页；写操作设计幂等键；错误不暴露堆栈。',
    dataStrategy: '本地 SQLite、生产 PostgreSQL；Repository 依赖 Database 接口；关键写操作使用事务；软删除、时间和状态字段统一；迁移必须双数据库成对。',
    qualityGoals: [{ scenario: '核心业务操作', metric: '成功率', target: '发布阻断用例 100% 通过', verification: '端到端自动化与业务验收' }, { scenario: '普通接口', metric: '响应时间', target: '95% 请求在 1 秒内完成', verification: '预发压测和生产监控' }],
    securityModel: [{ asset: '账号与业务数据', threat: '越权读取或修改', control: '服务端鉴权、最小权限、数据范围校验和审计日志', verification: '角色交叉测试与未授权请求测试' }, { asset: '敏感数据', threat: '日志或接口泄露', control: '字段脱敏、秘密环境变量、响应白名单', verification: '日志和构建产物扫描' }],
    authorization: input.roles.map((role) => ({ boundary: 'NestJS Controller', identity: '登录会话或令牌', permission: `${role}仅访问授权范围`, serverCheck: 'Guard + Service 数据范围校验' })),
    performance: [{ scenario: '列表查询', scale: input.expectedScale, target: '分页返回且不加载全部数据', approach: '索引、分页、只查询必要字段' }],
    resilience: [{ failure: '数据库或第三方暂时不可用', timeout: '外部请求 5 秒', retry: '只重试可安全重复的请求，最多 2 次', fallback: '返回明确失败并保留用户输入', alert: '连续失败或错误率超过阈值时告警' }],
    concurrency: '写操作使用业务唯一键或幂等键；状态更新带前置状态条件；重复提交返回同一结果；涉及多表更新时使用事务。',
    environments: ['开发', '测试', '预发', '生产'].map((environment) => ({ environment, purpose: `${environment}环境验证`, data: environment === '生产' ? '真实数据' : '脱敏或模拟数据', config: '独立环境变量', deployment: '独立构建与发布' })),
    observability: [{ signal: '接口错误与耗时', fields: 'traceId、模块、路由、状态码、耗时，不记录敏感正文', threshold: '错误率或 P95 超过目标', action: '告警、定位版本、必要时停止灰度' }, { signal: '核心业务成功率', fields: '业务动作、结果、失败分类', threshold: '低于业务基线', action: '排查依赖与规则，必要时回退' }],
    migrations: [{ change: '表或字段变更', forward: '先兼容代码，再执行成对迁移', backward: '至少一个版本兼容新旧结构', rollback: '回退代码前确认数据可逆并恢复备份', verification: '开发、测试、预发逐级验证' }],
    releaseRollback: '内部账号 → 5% → 20% → 50% → 100% 灰度；每档观察错误率、耗时和业务成功率；异常时停止流量、回退 Git 版本并按迁移方案恢复数据。',
    risks: [{ risk: 'AI 修改破坏模块边界或既有功能', trigger: '架构校验或回归测试失败', prevention: '一次只执行一个 Todo，小步提交，文件不超过 300 行', response: '回退当前提交，缩小改动范围后重新实现' }],
    testStrategy: '单元测试覆盖业务规则；接口测试覆盖鉴权、校验、幂等和错误；端到端测试覆盖 PRD 主流程、异常和权限；生成前执行 type-check、lint、build 和架构验证。',
    costCapacity: `按${input.expectedScale}设计，首版优先单实例与托管数据库；容量接近 70% 或响应指标持续恶化时再扩容。`, openQuestions: [],
  }
}
