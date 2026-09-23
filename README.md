# 运营后台页面技能

这是一个用于生成、评审和验证运营管理后台页面的规则工程。它的目标不是让 AI 随意拼页面，而是让需求先进入运营后台业务域，再按页面族、设计规则和已开放能力生成可复查的交付。

本仓库服务于运营管理后台页面，不绑定单一业务对象；页面字段、状态、权限和数据由每个页面需求明确。

## 调用模式


统一分发入口可以返回页面族、实现模式、资源和能力建议：

```bash
node scripts/dispatch-ops-page-command.mjs \
  --request "生成一个用户管理列表，支持查询、新增和查看详情"
```

完整触发范围、渐进式读取和交付约束以 [SKILL.md](SKILL.md) 为准。平台设计和公共实现的维护入口以 [CUSTOMIZE.md](CUSTOMIZE.md) 为准。

## 先从哪里看

如果你是产品、设计或研发同学，建议按以下顺序了解本仓库：

1. [SKILL.md](SKILL.md)：技能的触发范围、路由、交付流程和失败处理原则。
2. [运营后台域说明](modules/operations/DOMAIN.md)：了解业务域、路由别名和执行入口。
3. [导演规则](modules/operations/design-system/director-rules/01-visual-foundations.md)：了解视觉、布局、密度和组件气质。
4. [能力策略](modules/operations/execution/generation-policy.json)：确认页面类型、实现模式和已开放能力。
5. [页面契约](modules/operations/execution/page-contract.md)：了解 React 页面和 Page Spec 的交付边界。
6. [能力模型](modules/operations/execution/capability-model/capability-model.md)：了解组合页面的区域、能力和绑定规则。

## 目录说明

```text
ops-page-skill/
├── SKILL.md                         技能入口、路由范围和交付规则
├── README.md                        本说明
├── CUSTOMIZE.md                     设计和平台配置维护入口
├── agents/                          Codex 界面的技能元数据
├── assets/
│   ├── frontend-template/           React 页面模板
│   └── reference-*.png              页面视觉参考
├── modules/
│   └── operations/                  运营后台业务域
│       ├── design-system/           导演规则和页面族模板
│       ├── execution/               能力策略、Page Spec 契约、上下文和配方
│       ├── runtime/                 规格模式 Runtime、CSS 和本地 vendor
│       ├── shell/                   固定后台 Shell、品牌资产和组件
│       ├── DOMAIN.md                机器可读配置的说明
│       └── platform.config.json     平台主题与布局配置
├── references/                      Ant Design 组件参考
├── scripts/                         路由、脚手架、校验、构建和测试脚本
└── changes/                         本地页面需求与预览交付目录，不提交到 Git
```

`SKILL.md` 负责把请求限定在运营后台业务域。页面的视觉、模板、组件能力和渲染实现分别由导演规则、能力策略、Page Spec 和固定 Shell 决定。

## 当前能力

页面是否可以生成，以 [generation-policy.json](modules/operations/execution/generation-policy.json) 和能力模型为准，而不是仅凭规则文件是否存在。统一路由会根据需求选择 `ops-page-spec` 或 React；规格模式只覆盖常见列表，复杂能力使用 React 保留完整表达能力。

| 页面族 | 当前状态 | 已覆盖能力 |
| --- | --- | --- |
| 查询列表 | 可用 | 查询条件、表格、分页、金额与状态展示、列表内新增 Modal、详情 Drawer、行操作和批量工具。 |
| 表单 | 可用 | 独立表单、字段校验、分组布局、提交状态和失败恢复。 |
| 详情 | 可用 | 分组信息、指标摘要、嵌入式表格和详情 Drawer。 |
| 仪表盘 | 可用 | 指标卡、趋势分析、数据概览和自定义图表组合。 |
| 结果页 | 可用 | 成功、失败、处理结果和恢复入口。 |
| 自定义工作台 | 可用 | 多模块、审批流程、自定义画布和复杂组合，使用 React 模式。 |

页面能力和组件组合仍需按当前策略、页面契约和人工验收结果判断。未登记或未实现的能力会进入能力缺口流程，不应通过手写预览绕过策略。

## 页面如何生成

运营后台页面使用固定 Shell 和两种实现模式。AI 负责理解需求并编辑页面源文件，固定 Runtime 或 React 工具链负责生成可复查预览：

```text
页面需求
  -> 识别页面族、业务对象、角色、字段、操作和状态
  -> 读取业务域、导演规则与当前能力策略
  -> 创建新的 Change，填写 page-spec.json 或 React 源文件
  -> 运行规格校验或 TypeScript 校验
  -> 固定渲染器生成 preview.html
  -> 运行技能检查和必要回归测试
  -> 业务人员人工验收
  -> 交付
```

常见列表使用 `ops-page-spec` 模式：页面规格由 `page-spec.json` 驱动，预览使用 `modules/operations/runtime/` 中的本地 Runtime、CSS 和 vendor。审批、工作台、图表、多模块和复杂联动使用 React 模式，复用同一套 Shell 和平台配置。

新需求创建新的 Change；只有同一页面的后续修改才复用原 Change。浏览器检查属于交付后的人工验收，不会在普通生成流程中自动启动。

## 导演规则与单页需求

导演规则管理“同类页面长期应遵守什么”，单页需求管理“这一页展示什么”。两者不能互相替代：

| 目标 | 唯一维护位置 | 不应直接修改 |
| --- | --- | --- |
| 全局视觉、颜色、字重、密度和间距 | `modules/operations/design-system/director-rules/01-visual-foundations.md`、`modules/operations/platform.config.json` | 单页预览中的重复样式 |
| 页面家族和页面组合 | `modules/operations/design-system/page-patterns/`、`02-page-composition.md` | 已生成的页面文件 |
| 保存、校验、加载、失败恢复和验收 | `03-interaction-quality.md`、对应 `context-packs/` | 预览 HTML、CSS 和 JavaScript |
| 单页字段、文案、数据和默认值 | 当前 Change 的 `page-spec.json` 或 React 源文件 | 跨页面导演规则 |
| 页面能力是否开放 | `execution/generation-policy.json`、`execution/capability-model/` | 仅修改视觉规则不能越过能力策略 |
| 导航、页签、侧栏、项目切换和浮层 | `modules/operations/shell/` 及 `shell-contract.md` | 单页内重新实现公共 Shell |

路由和渐进式加载由 `scripts/dispatch-ops-page-command.mjs`、`rules-index.json` 和 `generation-policy.json` 共同维护。生成阶段只读取命中的页面族和按需能力；不匹配的页面族不会被提前加载。

## 如何提出一个新页面

用清晰的业务语言描述需求即可，无需指定代码或组件。建议包含以下信息：

```text
所属系统：运营管理后台 / 用户管理
使用者：运营人员
主要任务：查询、核对和处理用户记录
查询条件：用户名称、用户 ID、状态、创建时间
列表字段：用户 ID、用户名称、手机号、状态、创建时间
允许操作：查看详情、启用、停用
风险要求：停用前确认对象、影响和操作后状态
```

若需要抽屉、弹窗、全页表单、步骤流程或多模块工作台，也应说明字段分组、上传、复核、前后依赖和失败恢复要求。技能会根据能力策略选择页面族和实现模式。

## Change 交付目录

每个页面需求在本地使用独立的 `changes/YYYYMMDD-功能名称/` 目录。常见内容如下：

```text
changes/YYYYMMDD-功能名称/
├── request.txt                 原始需求
├── page-spec.json              ops-page-spec 模式的唯一编辑源
├── page-spec.json.request      规格模式保留的原始需求
├── src/                        React 模式的业务源文件
├── preview.html                可直接打开的评审预览
├── preview-assets/             预览所需的本地资源
├── preview-build.json          构建记录和耗时
└── review.md                   静态检查与人工验收记录
```

`page-spec.json` 或 React 源文件是页面的编辑源。`preview.html`、`preview-assets/` 和 `preview-build.json` 是派生产物，不应手工修改。`changes/` 已加入 `.gitignore`，用于本地需求与预览，不会随本仓库推送。

## 生成与校验

创建并构建规格模式页面：

```bash
node scripts/scaffold-ops-page-spec.mjs \
  --out changes/{change-id} \
  --request-file request.txt

# 完成 page-spec.json，并将 status 改为 ready
node scripts/validate-ops-page-spec.mjs \
  changes/{change-id}/page-spec.json
node scripts/build-ops-page-spec.mjs \
  --spec changes/{change-id}/page-spec.json
```

创建并构建 React 页面：

```bash
node scripts/scaffold-page.mjs \
  --out changes/{change-id} \
  --request-file request.txt
node scripts/prepare-preview.mjs \
  --project changes/{change-id}
cd changes/{change-id}
node scripts/build-preview.mjs
```

也可以使用统一收尾命令：

```bash
node scripts/finish-ops-page.mjs --change changes/{change-id}
```

运行技能资源、JSON、链接和 Runtime 完整性检查：

```bash
node scripts/check-skill.mjs
```

修改生成链路或 Runtime 后运行回归测试：

```bash
node --test scripts/test-generation.mjs scripts/test-spec-runtime.mjs
```

生成后的 `preview.html` 可直接在浏览器中打开，也可以在对应目录启动静态服务器：

```bash
python3 -m http.server 8080
```

预览用于产品、设计和交互验收，不等同于正式生产前端工程；正式上线仍需完成接口、权限、数据、异常处理和工程化验证。

## 常见问题

**为什么页面被路由到 React，而不是 `ops-page-spec`？**

`ops-page-spec` 只覆盖常见列表、查询、表格、分页、列表内新增 Modal、详情 Drawer 和有限行操作。审批、工作台、图表、多模块和复杂联动会保留到 React 模式。

**为什么页面不能生成？**

通常是页面族尚未满足当前能力策略，或需求缺少影响实现的关键信息。技能应报告能力缺口或请求补充信息，不应拼接未经验证的页面。

**为什么改了规则，预览没有变化？**

通用规则只定义设计决策。若变更涉及新的组件能力、页面结构或渲染行为，还需同步调整能力策略、Page Spec 契约、固定 Runtime 或 Shell，并运行对应回归测试。

**预览可以直接上线吗？**

不可以。预览用于业务和设计验收；正式上线仍需要按研发流程完成接口、权限、真实数据、异常处理和工程化验证。
