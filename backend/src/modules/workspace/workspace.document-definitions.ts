import type { z } from 'zod'
import type { DocumentDefinitionSchema, DocumentFieldSchema } from './workspace.schema'

export type DocumentDefinition = z.infer<typeof DocumentDefinitionSchema>
export type DocumentField = z.infer<typeof DocumentFieldSchema>
const text = (id: string, label: string, required = true, help?: string): DocumentField => ({ id, label, type: 'text', required, help })
const area = (id: string, label: string, required = true, help?: string): DocumentField => ({ id, label, type: 'textarea', required, help })
const list = (id: string, label: string, required = true, help?: string): DocumentField => ({ id, label, type: 'checklist', required, help })
const table = (id: string, label: string, columns: Array<[string, string]>, required = true, help?: string): DocumentField => ({ id, label, type: 'table', required, help, columns: columns.map(([columnId, columnLabel]) => ({ id: columnId, label: columnLabel })) })

const prdDefinition: DocumentDefinition = {
  type: 'prd', title: 'PRD 产品需求', description: '业务事实源：每项需求都有编号、场景、规则、异常处理和可验证结果。', fields: [
    text('goal', '1. 产品目标', true, '一句话写清为谁、解决什么问题、产生什么业务价值。'),
    area('background', '2. 背景、现状与问题证据', true, '包含当前做法、具体痛点、发生频率、影响和为什么现在做。'),
    list('objectives', '3. 本期业务目标', true, '每行一个本期必须实现的业务结果。'),
    list('nonGoals', '4. 非目标', false, '写清即使有价值、本期也不追求的结果。'),
    text('targetUsers', '5. 目标用户范围', true, '明确主要用户、次要用户和不服务的人群。'),
    table('personas', '6. 用户画像', [['role', '角色'], ['goal', '工作目标'], ['pain', '主要困难'], ['ability', '数字化熟练度']], true, '每类核心用户一行。'),
    table('userScenarios', '7. 用户场景与任务', [['id', '场景编号'], ['role', '谁'], ['trigger', '何时触发'], ['task', '要完成什么'], ['result', '期望结果']], true),
    table('metrics', '8. 成功指标', [['metric', '指标'], ['baseline', '当前值'], ['target', '目标值'], ['method', '统计方法']], true, '没有基线时明确写“上线首周采集”。'),
    area('scope', '9. 版本与交付范围', true, '说明验证版、业务版或商用版，以及本次交付边界。'),
    list('mustHave', '10. 首版必须有', true), list('excluded', '11. 明确不做', true),
    table('features', '12. 功能需求清单', [['id', '需求编号'], ['priority', '优先级'], ['name', '功能'], ['userValue', '用户价值'], ['acceptance', '完成标准']], true, '一行一个可独立开发和验收的需求，编号使用 REQ-001。'),
    table('flows', '13. 需求操作流程', [['requirement', '需求编号'], ['precondition', '前置条件'], ['trigger', '触发动作'], ['mainFlow', '正常流程'], ['exceptions', '失败与异常流程']], true),
    table('businessRules', '14. 业务规则', [['id', '规则编号'], ['condition', '适用条件'], ['rule', '规则'], ['result', '处理结果']], true, '状态、计算、时间、重复提交和数量限制分别成行。'),
    table('stateRules', '15. 状态变化', [['object', '业务对象'], ['from', '原状态'], ['event', '触发事件'], ['to', '新状态'], ['forbidden', '禁止情况']], true),
    table('roles', '16. 角色权限', [['role', '角色'], ['scope', '数据范围'], ['allowed', '允许操作'], ['forbidden', '禁止操作']], true, '权限必须由后端校验，不能只隐藏按钮。'),
    table('dataNeeds', '17. 业务数据需求', [['data', '数据'], ['source', '来源'], ['purpose', '用途'], ['sensitivity', '敏感等级'], ['retention', '保存期限']], true),
    table('notifications', '18. 通知与提醒', [['trigger', '触发条件'], ['recipient', '接收人'], ['channel', '渠道'], ['content', '内容'], ['failure', '失败处理']], false),
    table('edgeCases', '19. 异常与边界场景', [['scenario', '场景'], ['expected', '系统应如何处理'], ['message', '用户看到什么']], true, '至少覆盖空数据、重复操作、无权限、慢网络和第三方失败。'),
    list('dependencies', '20. 外部依赖', false), list('assumptions', '21. 前提与假设', false),
    table('risks', '22. 产品风险', [['risk', '风险'], ['signal', '触发信号'], ['response', '处理办法']], true),
    list('openQuestions', '23. 待确认问题', false, '只保留会影响范围、规则或验收的问题。'),
  ],
}

const technicalDefinition: DocumentDefinition = {
  type: 'technical', title: '技术方案', description: '技术事实源：从 PRD 逐项映射到模块、数据、接口、质量指标、风险和回退。', fields: [
    area('summary', '1. 方案摘要', true, '非研发人员也能看懂的整体实现说明。'),
    table('traceability', '2. PRD 需求追溯', [['requirement', '需求编号'], ['module', '负责模块'], ['implementation', '实现方式'], ['verification', '验证方法']], true),
    list('drivers', '3. 架构目标与决策依据', true),
    table('constraints', '4. 约束清单', [['dimension', '维度'], ['constraint', '约束'], ['impact', '对方案的影响']], true),
    table('systemContext', '5. 系统边界与外部关系', [['participant', '用户/系统'], ['interaction', '如何交互'], ['ownership', '谁负责'], ['trust', '信任边界']], true),
    table('layers', '6. 五层架构', [['layer', '层级'], ['responsibility', '职责'], ['allowed', '允许依赖'], ['forbidden', '禁止事项']], true),
    table('modules', '7. 模块拆分', [['module', '模块'], ['responsibility', '职责'], ['input', '输入'], ['output', '输出'], ['dependencies', '依赖'], ['extension', '扩展点']], true),
    area('dependencyRules', '8. 模块依赖规则', true, '明确公共能力、业务模块和禁止的跨模块调用。'),
    table('keyFlows', '9. 关键流程', [['flow', '流程'], ['trigger', '触发'], ['steps', '处理步骤'], ['consistency', '一致性要求'], ['failure', '失败处理']], true),
    table('integrations', '10. 第三方集成', [['system', '系统'], ['direction', '方向'], ['protocol', '方式'], ['auth', '鉴权'], ['timeout', '超时'], ['fallback', '兜底']], false),
    table('decisions', '11. 关键技术决策', [['id', '决策编号'], ['status', '状态'], ['options', '候选方案'], ['choice', '最终选择'], ['reason', '理由'], ['consequence', '代价与后果']], true),
    area('apiStrategy', '12. API 设计策略', true), area('dataStrategy', '13. 数据与事务策略', true),
    table('qualityGoals', '14. 可验证质量目标', [['scenario', '场景'], ['metric', '指标'], ['target', '通过标准'], ['verification', '验证方式']], true),
    table('securityModel', '15. 安全威胁与控制', [['asset', '保护对象'], ['threat', '风险'], ['control', '控制措施'], ['verification', '验证']], true),
    table('authorization', '16. 鉴权与授权', [['boundary', '入口'], ['identity', '身份来源'], ['permission', '权限规则'], ['serverCheck', '服务端校验']], true),
    table('performance', '17. 性能与容量', [['scenario', '场景'], ['scale', '规模'], ['target', '目标'], ['approach', '实现策略']], true),
    table('resilience', '18. 稳定性与降级', [['failure', '故障'], ['timeout', '超时'], ['retry', '重试'], ['fallback', '降级'], ['alert', '告警']], true),
    area('concurrency', '19. 并发、幂等与重复提交', true),
    table('environments', '20. 环境与部署', [['environment', '环境'], ['purpose', '用途'], ['data', '数据'], ['config', '配置'], ['deployment', '部署方式']], true),
    table('observability', '21. 日志、监控与告警', [['signal', '信号'], ['fields', '记录字段'], ['threshold', '阈值'], ['action', '处理动作']], true),
    table('migrations', '22. 数据迁移与兼容', [['change', '变更'], ['forward', '升级步骤'], ['backward', '兼容策略'], ['rollback', '回退'], ['verification', '验证']], true),
    area('releaseRollback', '23. 发布、灰度与回退', true),
    table('risks', '24. 技术风险', [['risk', '风险'], ['trigger', '触发信号'], ['prevention', '预防'], ['response', '应对']], true),
    area('testStrategy', '25. 技术验证策略', true), area('costCapacity', '26. 成本与容量预估', false),
    list('openQuestions', '27. 待确认技术问题', false),
  ],
}

function assignGroups(definition: DocumentDefinition, groups: Array<[string, string[]]>) {
  for (const [group, ids] of groups) for (const field of definition.fields) if (ids.includes(field.id)) field.group = group
}

assignGroups(prdDefinition, [
  ['一、概览与目标', ['goal', 'background', 'objectives', 'nonGoals']],
  ['二、用户与场景', ['targetUsers', 'personas', 'userScenarios']],
  ['三、指标与版本范围', ['metrics', 'scope', 'mustHave', 'excluded']],
  ['四、需求与操作流程', ['features', 'flows']],
  ['五、业务规则、权限与数据', ['businessRules', 'stateRules', 'roles', 'dataNeeds', 'notifications']],
  ['六、异常、依赖与风险', ['edgeCases', 'dependencies', 'assumptions', 'risks', 'openQuestions']],
])
assignGroups(technicalDefinition, [
  ['一、方案依据与需求映射', ['summary', 'traceability', 'drivers', 'constraints']],
  ['二、系统边界与结构', ['systemContext', 'layers', 'modules', 'dependencyRules']],
  ['三、关键流程与外部集成', ['keyFlows', 'integrations', 'apiStrategy', 'dataStrategy']],
  ['四、技术决策与质量目标', ['decisions', 'qualityGoals']],
  ['五、安全、性能与稳定性', ['securityModel', 'authorization', 'performance', 'resilience', 'concurrency']],
  ['六、环境、运维与数据变更', ['environments', 'observability', 'migrations', 'releaseRollback']],
  ['七、风险、验证与成本', ['risks', 'testStrategy', 'costCapacity', 'openQuestions']],
])

export const documentDefinitions: DocumentDefinition[] = [prdDefinition,
  { type: 'ux', title: '交互与页面说明', description: '定义入口、页面和各种交互状态。', fields: [text('devices', '目标设备'), area('navigation', '导航与页面层级'), table('pages', '页面清单', [['name', '页面'], ['entry', '入口'], ['task', '核心任务']]), area('states', '加载、空数据、成功、失败与无权限状态'), area('forms', '表单校验与危险操作确认')] },
  technicalDefinition,
  { type: 'database', title: '数据库设计', description: '定义数据对象、字段、关系和迁移。', fields: [table('entities', '业务对象', [['name', '对象'], ['meaning', '含义'], ['retention', '保存期限']]), table('tables', '表与字段', [['table', '表'], ['field', '字段'], ['type', '类型'], ['rule', '约束']]), area('relations', '关系与删除规则'), area('migration', '迁移、备份与恢复')] },
  { type: 'api', title: 'API 接口', description: '定义前后端通信契约。', fields: [area('conventions', '认证、响应、分页和错误约定'), table('endpoints', '接口清单', [['method', '方法'], ['path', '路径'], ['purpose', '用途'], ['permission', '权限']]), area('errors', '错误码与失败处理')] },
  { type: 'development', title: '开发实施计划', description: '拆分可独立验证和提交的任务。', fields: [text('stableVersion', '当前稳定版本'), area('scope', '开发范围与不改范围'), table('tasks', '任务拆分', [['order', '顺序'], ['task', '任务'], ['done', '完成标准']]), area('tests', '研发自测'), area('risks', '阻塞与风险', false)] },
  { type: 'test', title: '测试与业务验收', description: '把 PRD 验收标准转成可执行用例。', fields: [area('scope', '测试范围与环境'), table('cases', '测试用例', [['requirement', '需求'], ['steps', '步骤'], ['expected', '预期']]), area('regression', '异常、权限、多端和回归范围'), area('releaseBlockers', '发布阻断项')] },
  { type: 'release', title: '上线发布方案', description: '定义环境、灰度、监控和回退。', fields: [text('version', '发布版本'), area('changes', '本次变化'), area('environment', '四套环境与配置'), table('rollout', '灰度批次', [['group', '对象/比例'], ['duration', '观察时间'], ['threshold', '停止阈值']]), area('monitoring', '监控和告警'), area('rollback', '回退步骤')] },
  { type: 'changelog', title: '迭代、变更与问题', description: '记录版本、需求变化、BUG 和复盘。', fields: [table('versions', '版本记录', [['version', '版本'], ['changes', '变化'], ['verification', '验证']]), table('requests', '需求变更', [['change', '变化'], ['impact', '影响'], ['decision', '决定']]), table('bugs', 'BUG 记录', [['issue', '问题'], ['severity', '等级'], ['resolution', '修复']]), area('review', '迭代复盘')] },
]

export const presetDefinitions = [
  { id: 'admin' as const, name: '后台管理', description: '侧边导航、数据管理和运营工作台。' },
  { id: 'website' as const, name: '官网 / H5', description: '顶部导航、内容首页和移动端适配。' },
  { id: 'tool' as const, name: '业务工具', description: '聚焦输入、处理结果和历史记录。' },
]
