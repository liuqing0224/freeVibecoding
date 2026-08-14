# VibeCoding 工作台

面向产品、运营、业务和管理者的本地产研工作台。通过引导式访谈整理项目需求，持续维护 9 类产研文档，并生成一套可继续交给 Coding Agent 开发的 Vue 3 + NestJS 模板仓库。

项目采用本地优先设计：工作台只监听本机地址，项目资料保存在本地数据库，生成的仓库写入用户指定的本机目录。

## 为什么做这个项目

非研发人员使用 AI 编程时，真正困难的通常不是生成代码，而是：

- 需求没有边界，AI 每轮理解都不同。
- PRD、技术方案、数据库和接口文档互相脱节。
- 没有足够细的开发任务，Coding Agent 一次修改范围过大。
- 项目生成后缺少架构约束、验证流程和可回退的 Git 起点。

VibeCoding 工作台把这些步骤串成一条可操作流程，让业务想法先变成稳定文档，再变成可开发仓库。

## 界面预览

### 项目工作台

![项目列表：展示项目类型、文档完整度、状态以及编辑、生成和删除操作](docs/images/project-list.jpg)

### Markdown 文档编辑器

![文档编辑器：左侧文档列表、中间 Markdown 编辑区、右侧实时阅读视图](docs/images/document-editor.jpg)

## 核心能力

- **访谈式建项**：从新建项目开始，通过多轮问题逐步确认目标用户、业务痛点、成功指标、首版范围、权限和数据敏感性。
- **上下文连续**：沟通结果持续整理进访谈临时文档，后续问题会引用已确认内容，并优先提供可直接选择的选项。
- **多类型项目**：一个项目可以同时选择后台管理、官网 / H5 和业务工具预设。
- **9 类产研文档**：统一维护 PRD、交互说明、技术方案、数据库设计、API、开发计划、测试验收、上线方案和变更记录。
- **Markdown 可编辑**：每份文档都支持 Markdown 源码编辑、安全渲染、实时预览和自动保存，同时保留结构化填写方式。
- **细粒度 TodoList**：文档完成后按页面、接口、数据字段和测试用例拆分开发任务，一个接口对应一个独立任务。
- **本地 Agent 扫描**：识别本机可用的 Codex 或 Claude Coding Agent，用于辅助访谈。
- **模板仓库生成**：生成 Vue 3 前端、NestJS 后端、SQLite / PostgreSQL 数据层、项目文档、`AGENTS.md`、Skills 和验证脚本。
- **Git 初始存档**：生成完成后自动执行 `git init` 和首次提交，不修改用户的全局 Git 身份。
- **安全生成**：目标目录已存在时拒绝覆盖，失败时清理临时目录，不删除已生成仓库。

## 使用流程

```text
新建项目
  -> 访谈确认业务信息
  -> 完善 9 类产研文档
  -> 检查文档完整度
  -> 生成细粒度 TodoList
  -> 确认输出目录
  -> 生成模板仓库并创建 Git 首次提交
  -> 使用 Coding Agent 按 TodoList 逐项开发
```

## 产研文档

生成仓库中的文档位于 `docs/product/`：

| 文件 | 用途 |
| --- | --- |
| `01-PRD.md` | 产品目标、用户场景、功能范围、业务规则、异常和验收条件 |
| `02-UX-SPEC.md` | 页面清单、用户路径、交互状态和多端适配 |
| `03-TECH-SOLUTION.md` | 需求映射、系统边界、模块、关键流程、安全、性能和回退 |
| `04-DATABASE-DESIGN.md` | 数据实体、字段、关系、索引和数据安全 |
| `05-API-SPEC.md` | 接口路径、输入输出、权限和错误处理 |
| `06-DEVELOPMENT-PLAN.md` | 实施顺序、依赖和完成标准 |
| `07-TEST-ACCEPTANCE.md` | 测试场景、操作步骤和业务验收结果 |
| `08-RELEASE-PLAN.md` | 环境、灰度、监控和回滚方案 |
| `09-CHANGELOG.md` | 需求变更、问题和版本记录 |

## 技术架构

工作台与生成仓库使用不同后端技术栈：

| 范围 | 技术栈 |
| --- | --- |
| 工作台前端 | Vue 3、TypeScript、Vite、Pinia、Vue Router、Less |
| 工作台后端 | Node.js、Fastify、TypeScript、Zod |
| 工作台数据 | SQLite（本地默认）或 PostgreSQL |
| 生成仓库前端 | Vue 3、TypeScript、Vite |
| 生成仓库后端 | NestJS、TypeScript、Zod |
| 生成仓库数据 | SQLite / PostgreSQL 抽象层和成对迁移 |

前后端业务代码都按闭环模块组织。模块之间不得直接互相引用，公共能力必须提升到共享层；后端 API 合同统一由 Zod Schema 定义。

## 快速开始

### 环境要求

- Node.js 20 或更高版本
- npm
- Git

### 1. 启动后端

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

后端默认运行在 `http://127.0.0.1:3000`，本地开发默认使用 SQLite。

### 2. 启动前端

在另一个终端中执行：

```bash
cd frontend
npm install
npm run dev
```

浏览器打开 `http://127.0.0.1:5173`。前端开发服务器会把 `/api` 请求代理到后端。

### 3. 配置生成目录

进入工作台“设置”，确认模板仓库输出目录。默认目录为：

```text
~/Documents/VibeCodingProjects
```

目标项目目录必须不存在，工作台不会覆盖已有目录。

## PostgreSQL

在 `backend/.env` 中配置：

```env
DB_DIALECT=postgres
DATABASE_URL=postgres://user:pass@host:5432/database
```

执行迁移并启动：

```bash
cd backend
npm run db:migrate
npm run start
```

## 项目结构

```text
.
├── AGENTS.md                    # 当前仓库的 Agent 工作规则
├── .agents/skills/              # 架构、前后端模块和验证 Skills
├── docs/
│   ├── images/                  # README 界面截图
│   └── vibe-coding/deliverables # 工作台自身的产研文档
├── frontend/
│   └── src/
│       ├── components/          # 通用基础组件
│       ├── layouts/             # 全局布局
│       ├── modules/workspace/   # 工作台前端闭环模块
│       └── modules/todo/        # 参考模块
└── backend/
    └── src/
        ├── db/                  # SQLite / PostgreSQL 抽象和迁移器
        ├── modules/workspace/   # 文档、访谈、TodoList 和仓库生成器
        ├── modules/todo/        # 参考模块
        └── utils/               # 响应、错误、ID 和日志工具
```

## 开发约束

- 每个源文件不超过 300 行，按功能职责拆分。
- 前后端模块不得直接跨模块引用。
- 前端只能通过模块 `api/` 层请求后端。
- 后端请求和响应结构必须由 Zod Schema 定义。
- 数据库变更必须同时提供 SQLite 和 PostgreSQL 迁移。
- 完成修改前必须通过项目验证脚本。

完整规则见 [`AGENTS.md`](AGENTS.md)。

## 验证

```bash
bash .agents/skills/vibecoding-verify/scripts/verify.sh
```

验证内容包括：

1. 前后端模块结构和依赖边界。
2. SQLite / PostgreSQL 迁移是否成对。
3. 数据库 DDL 规则。
4. 前后端 API 合同对齐。
5. TypeScript 类型检查和 ESLint。

成功时输出：

```text
verify: ALL PASSED
```

后端单元测试：

```bash
cd backend
npm test
```

## 参与贡献

1. Fork 仓库并创建功能分支。
2. 阅读 `AGENTS.md` 和相关项目 Skill。
3. 保持改动集中，补充与风险匹配的测试。
4. 运行完整验证脚本。
5. 提交 Pull Request，并说明行为变化、验证结果和截图。

提交信息建议使用：

```text
feat: add project export option
fix: restore markdown autosave
docs: update workspace guide
```

## 安全边界

当前版本定位为可信本机上的单人工作台，不提供账号体系和远程访问。不要把后端监听地址暴露到公网，也不要把 `.env`、数据库文件或生成目录中的敏感业务数据提交到公开仓库。

## License

当前仓库尚未包含开源许可证。在正式公开发布前，请由项目维护者选择许可证并添加 `LICENSE` 文件；未添加许可证并不等同于允许任意复制、修改或分发。
