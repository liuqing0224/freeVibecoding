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

### 新建项目访谈

![新建项目访谈：通过业务语言逐步整理项目草稿](docs/images/project-create.jpg)

### 开发 TodoList

![开发 TodoList：按接口、页面、字段和测试用例拆分任务](docs/images/todo-list.jpg)

### 仓库生成

![仓库生成：确认本地目录、Git 托管方式和生成检查](docs/images/generate-project.jpg)

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

### 第一次使用

1. 启动前后端并打开 `http://127.0.0.1:5173/projects`。
2. 点击“新建项目”，用业务语言描述要解决的问题，不需要先写技术方案。
3. 根据 Agent 给出的选项确认项目名称、项目类型、目标用户、首版功能和边界。
4. 创建项目后继续完善 PRD 和交互说明。每轮沟通会整理到临时文档，刷新页面后仍可继续。
5. 在业务文档页使用“用 Agent 优化当前文档”，Agent 会基于当前文档和质量评分提出修改建议；确认前不会写入正式文档。
6. 点击流程中的“同步技术文档”，检查技术方案、数据库、API、开发、测试和发布文档。
7. 点击“生成开发 TodoList”，按接口、页面、字段和测试用例逐项确认开发任务。
8. 在仓库配置页选择本机、GitHub 或 GitLab，确认目标目录后生成模板仓库。
9. 进入生成仓库，先阅读 `AGENTS.md`、`docs/product/` 和 `TODO.md`，再让 Coding Agent 一次只处理一个 Todo。

Agent 不可用时，页面会保留已填写内容并提供手动表单。手动表单与 Agent 访谈使用同一套文档和完整度规则，不会改变后续流程。

### 老项目怎么接入

当前版本不会直接扫描、接管或覆盖已有代码目录。老项目建议采用“文档同步模式”：

1. 新建一个与老项目对应的工作台项目，在访谈中说明现有功能、用户、页面、接口、数据库和技术栈。
2. 将老项目已有的 PRD、README、接口说明和数据库说明，分别整理到九类产研文档中。
3. 在文档页使用 Agent 定向优化，明确告诉 Agent 哪些内容来自现有代码、哪些内容需要确认。
4. 生成 TodoList 时只保留新增需求、改动需求、问题修复和验收任务，不把已存在功能重复列为开发任务。
5. 不要点击“生成仓库”覆盖老项目；将工作台中的 `docs/product/`、`TODO.md` 和 `AGENTS.md` 经差异确认后复制到老项目。

建议在老项目中保留以下证据：

```text
老项目仓库/
├── docs/product/       # 已确认的九类产研文档
├── TODO.md             # 新增、变更和修复任务
├── AGENTS.md           # 老项目现有架构与 AI 修改边界
└── src/                # 原有代码，不由工作台覆盖
```

老项目的正式导入、只读代码扫描、差异预览和增量写回尚未纳入当前版本。工作台不会读取账号凭据，也不会自动推送 GitHub 或 GitLab。

### 文档如何交给 Coding Agent

在生成仓库根目录执行：

```text
请先阅读 AGENTS.md、docs/product/01-PRD.md、docs/product/02-UX-SPEC.md 和 TODO.md。
只处理 TODO.md 中指定的一个编号任务。
完成后运行相关类型检查、测试和验证脚本，并汇报修改文件、验证命令和未解决问题。
不要修改未被任务引用的业务规则，不要删除文档事实源。
```

生成仓库会固定使用 NestJS 后端、Vue 3 前端，并在 `AGENTS.md` 中约束每个源文件不超过 300 行、按功能拆分模块。

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

## 当前版本边界

- 工作台自身使用 Fastify；生成仓库使用 NestJS。
- 只支持本机单人使用，不包含团队协作、账号体系、任务分派和远程推送。
- Agent 只负责访谈和文档建议，不直接生成业务代码，也不会在未确认时修改正式文档。
- 生成器要求目标目录不存在；已有目录会被阻止，避免覆盖用户代码。
- 老项目目前以文档同步方式接入，完整的本地代码扫描与增量合并属于后续能力。

## License

当前仓库尚未包含开源许可证。在正式公开发布前，请由项目维护者选择许可证并添加 `LICENSE` 文件；未添加许可证并不等同于允许任意复制、修改或分发。
