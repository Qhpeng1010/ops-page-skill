# 平台定制入口

本文件只负责定位维护入口，不保存第二份设计或交互规则。生成页面时按路由渐进读取规则；修改平台规范时优先改下表对应的唯一来源。

## 三个设计规范

| 规范 | 唯一维护文件 | 何时读取 |
| --- | --- | --- |
| 视觉规范 | [01-visual-foundations.md](modules/operations/design-system/director-rules/01-visual-foundations.md) | 每次生成都读取。包含主色、字重、层级、间距、背景、菜单、页签、表格等视觉默认值。 |
| 页面组合规范 | [02-page-composition.md](modules/operations/design-system/director-rules/02-page-composition.md) | 需求涉及 Modal、Drawer、新标签页、多模块、业务 Tabs 或自定义组合时读取。 |
| 交互与验收规范 | [03-interaction-quality.md](modules/operations/design-system/director-rules/03-interaction-quality.md) | 需求涉及校验、提交、异步、遮罩、抽屉操作、失败恢复、复杂交互或交付验收时读取。 |

渐进式读取由 [rules-index.json](modules/operations/rules-index.json)、[generation-policy.json](modules/operations/execution/generation-policy.json) 和 [dispatch-ops-page-command.mjs](scripts/dispatch-ops-page-command.mjs) 共同维护：视觉规则属于 always；页面组合和交互规则按需求进入 onDemand，不匹配时不读取。

## 配置与实现入口

| 想修改什么 | 唯一来源 | 生效方式 |
| --- | --- | --- |
| 平台名、主色、字体、圆角、密度、间距 | [platform.config.json](modules/operations/platform.config.json) | React 新脚手架复制配置；既有 React 页面同步 `src/platform/platform.config.json`，规格预览每次构建注入当前配置。主色为 `theme.token.colorPrimary`，当前 `#1890FF`；普通字重为 `theme.token.fontWeight`，当前 `400`。 |
| 页面族的查询、表单、详情、看板、结果页结构 | [page-patterns](modules/operations/design-system/page-patterns/) | 只读取路由命中的页面族文件；模块页另读 `module-page.md`。 |
| Ant 组件 API 和组件选择 | [antd-components.md](references/antd-components.md) | 生成页面前按需读取；不把 API 规则复制到本文件。 |
| 菜单、页签、顶栏、项目切换、抽屉 Shell | [shell-contract.md](modules/operations/shell/shell-contract.md) 与 [shell/](modules/operations/shell/) | 修改公共框架后同步 React 预览，并重编译规格模式共享包。 |
| 页面能力与组合能力 | [capability-model](modules/operations/execution/capability-model/) | 先读能力契约，已有可运行实现才登记为 example。 |
| 页面实现模式 | [generation-policy.json](modules/operations/execution/generation-policy.json)、[ops-page-spec.md](modules/operations/execution/context-packs/ops-page-spec.md) | 常见列表走 `ops-page-spec` 本地 Runtime；复杂或自定义能力走 React，不能为提速删除 React。 |
| 页面配方与组合 | [recipe-registry.json](modules/operations/execution/recipes/recipe-registry.json)、[recipes.md](modules/operations/execution/recipes/recipes.md) | 按自然语言语义组合列表、Modal、Drawer、新标签页和行操作确认；配方不限制业务字段。 |
| 生成、校验、构建和性能 | [SKILL.md](SKILL.md)、[generation-policy.json](modules/operations/execution/generation-policy.json) | 保持路由、渐进读取、复用 Change 和验证流程一致。 |
| 规格模式 Runtime 与 vendor | [runtime/](modules/operations/runtime/)、[build-ops-page-spec.mjs](scripts/build-ops-page-spec.mjs) | 公共入口为 `platform-entry.ts`，用 `build-spec-runtime.mjs --dependencies <已准备项目或缓存>` 维护编译；两种模式共享 Shell 与锁定依赖。日常构建只验证并复制本地包。 |

## 当前关键配置

- `theme.token.colorPrimary`: `#1890FF`，主按钮、链接、信息提示和选中态从此派生。
- `theme.token.fontWeight`: `400`，查询条件、表单、按钮、label、Table 文字和其他普通文字默认使用常规体。
- `theme.token.fontWeightStrong`: `500`，所有语义加粗统一使用 PingFang SC Medium / 中黑体；Table 表头同步 `theme.components.Table.fontWeightStrong=500`。
- `layout.elementGap`: `16px`，页面区块、查询条件、详情和表单网格间距。
- `layout.buttonGap`: `8px`，按钮组间距；列表操作列的文字按钮之间固定使用该间距，React 实现不得用 `Space size={0}` 覆盖。
- `layout.newTabBackground`: `#EAEDF0`；`newTabPadding` / `newTabModuleGap`: `12px`。
- `layout.modalDividerColor` / `modalDividerGap`: 灰色 1px 分割线和 16px 两侧间距。
- 详情 Drawer 内容区四边沿用 Ant 默认 `24px` padding；`layout.detailTitleGap` 仅用于详情分组标题到内容的 `12px` 间距；Modal 沿用现有标题分割线和正文留白标准。

## 修改后的验证

```bash
cd /Users/haipeng/Documents/ChatGPT/运营后台skill/ops-page-skill
node scripts/check-skill.mjs
```

修改 Shell 或组件实现时，再对预览项目执行 TypeScript 检查和 Vite 构建。不要只改 `CUSTOMIZE.md` 里的说明；规则改动应落到对应的 `director-rules`、配置、页面模式或 Shell 源文件。

维护共享 Shell 或依赖后，先更新本地共享包，再运行 `node --test scripts/test-generation.mjs scripts/test-spec-runtime.mjs` 和 `node scripts/check-skill.mjs`。生成单个页面不运行维护编译，不要求用户安装依赖。
