# ops-page-skill

一个用于 Codex 的运营后台页面生成技能。它把自然语言需求路由到合适的页面模式，生成可编辑的 React/TypeScript 页面或本地 `ops-page-spec` 规格页面，并复用统一的 Ant Design Shell、主题和交互规范。

## 能做什么

- 生成列表、查询、表单、详情、看板、结果页和多模块工作台。
- 常见列表使用本地 `ops-page-spec` Runtime，直接生成可打开的静态预览。
- 复杂联动、审批、图表和自定义工作台使用 React/TypeScript。
- 统一复用菜单、页签、查询区、表格、Modal、Drawer、主题配置和交互规则。
- 在生成前按需求路由页面族和能力，避免读取无关资料。

## 在 Codex 中使用

将本仓库作为 `ops-page-skill` 安装到 Codex skills 目录后，可以直接使用：

```text
$ops-page-skill 生成一个用户管理列表，支持查询、新增和查看详情
```

入口说明和完整约束见 [SKILL.md](SKILL.md)。平台规则的维护入口见 [CUSTOMIZE.md](CUSTOMIZE.md)。

## 本地生成页面

环境要求：Node.js 20.19 或更高版本。

先让分发器判断页面族和实现模式：

```bash
node scripts/dispatch-ops-page-command.mjs \
  --request "生成一个用户管理列表，支持查询、新增和查看详情"
```

常见列表可以使用规格模式：

```bash
node scripts/scaffold-ops-page-spec.mjs \
  --out changes/user-management \
  --request-file request.txt

# 完成 page-spec.json，并将 status 改为 ready
node scripts/validate-ops-page-spec.mjs \
  changes/user-management/page-spec.json
node scripts/build-ops-page-spec.mjs \
  --spec changes/user-management/page-spec.json
```

复杂页面使用 React 模式：

```bash
node scripts/scaffold-page.mjs \
  --out changes/merchant-workspace \
  --request-file request.txt
node scripts/prepare-preview.mjs \
  --project changes/merchant-workspace
cd changes/merchant-workspace
node scripts/build-preview.mjs
```

构建完成后，预览入口位于对应 Change 目录的 `preview.html`。它和 `preview-assets/` 可以直接交付或打开，不依赖开发服务器。

## 目录结构

```text
SKILL.md                         技能入口与完整工作流
CUSTOMIZE.md                     设计和平台配置维护入口
agents/openai.yaml               Codex 技能元数据
assets/frontend-template/        React 页面模板
assets/reference-*.png           页面视觉参考
modules/operations/              页面规则、Shell、Runtime 和能力契约
references/                      Ant Design 组件参考
scripts/                         路由、脚手架、校验、构建和测试脚本
changes/                         本地生成的页面 Change（默认不提交）
```

公共视觉规则位于 [01-visual-foundations.md](modules/operations/design-system/director-rules/01-visual-foundations.md)，公共框架契约位于 [shell-contract.md](modules/operations/shell/shell-contract.md)，平台主题配置位于 [platform.config.json](modules/operations/platform.config.json)。

## 校验

检查技能资源、JSON、链接和运行时完整性：

```bash
node scripts/check-skill.mjs
```

修改生成链路或 Runtime 后运行回归测试：

```bash
node --test scripts/test-generation.mjs scripts/test-spec-runtime.mjs
```

## 生成物管理

页面生成物放在 `changes/<change-id>/`。仓库默认忽略历史 Change、缓存、依赖目录、构建产物和系统文件，避免把本地页面预览和运行时缓存提交到技能仓库。
