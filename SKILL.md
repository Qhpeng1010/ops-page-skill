---
name: ops-page-skill
description: 根据自然语言生成、修改或评审运营后台页面，支持查询列表、表单、详情、看板、审批流程与自定义工作台。常见列表可用本地 ops-page-spec 规格运行时快速生成，复杂能力继续使用 React/TypeScript。整体布局参考内置截图，菜单及所有标准交互组件使用 Ant Design，平台主题、框架和业务能力可独立定制。不要求使用 Ant Design Pro，也不限制为固定模板。
---

# 运营后台页面生成

按自然语言组合真实 Ant Design 组件，交付可编辑业务源文件（React/TypeScript 或页面规格）及可直接打开的 HTML。页面族和能力目录是建议，允许按业务扩展；不把需求限制为固定模板或 JSON 渲染器。

## 入口与范围

- `$ops-page-skill <需求>`、`/ops:page <需求>`：生成页面。
- `/ops:style <修改>`：先读 [CUSTOMIZE.md](CUSTOMIZE.md)，仅修改涉及的配置、规则或公共 Shell。
- `/ops:review <页面>`：按请求评审或修复；只要方案时不扩大为实现。
- 本技能自包含，不依赖全局 `page-builder`，不加载它或执行其模块安装、doctor、plan、exec；只有用户明确选用 Page Builder 才切换。执行成本观察器也仅在用户明确要求时使用。
- **新需求新建 Change，同一页面的后续修改才复用原 Change**。用户要求“新增一个”时即使同类页面已存在，也创建新目录；重名加序号，不覆盖原物料。公共 Shell、主题和匹配的依赖可复用，业务数据与代码属于各自项目。
- 工作源与物料统一在本技能 `changes/YYYYMMDD-名称/`，交付同目录 `preview.html` 及其 `preview-assets/`，不以共享开发服务器地址代替物料。

## 路由与渐进式读取

确定当前 `SKILL.md` 所在的绝对目录为 `<skill-root>`，后续路径都从这里解析。把完整原始需求保存到独立的 UTF-8 文件，不先创建目标 Change 目录；从任意工作目录执行：

```bash
node <skill-root>/scripts/dispatch-ops-page-command.mjs --request-file <request.txt>
```

短需求也可用 `--request`。分发器只输出页面族、能力建议和资源路径，不生成业务代码。原始需求存入 Change 的 `request.txt`；规格模式同时保留 `page-spec.json.request`，不要手工重打一遍。

1. 读返回的 `resources.always`，再读命中的 `resources.family`。
2. 仅按本次需要读取 `resources.onDemand`；列表中新增、详情等能力会带上浮层组合与交互规则，不要求用户使用技术术语。
3. 独立项目读 `resources.generate`；`resources.review` 只列本轮尚未读取的检查规则。
4. 同一任务续做、上下文压缩后，沿用已确定目录、路由和读取记录，先检查待完成文件，不重新扫全项目或重读全部 Shell、旧 Change、历史验收记录。需求变化才重新路由；接口缺失时定向补读对应文件。

分发器还会选择页面实现模式：

- `ops-page-spec` 用于常见列表、查询、表格、分页、列表内新增 Modal、详情 Drawer 和有限的行操作。它以 `page-spec.json` 为业务源文件，使用 skill 内本地 Runtime、CSS 和 vendor 生成静态预览。
- `react` 保留完整的 React/TypeScript 能力，适用于审批、工作台、图表、多模块、复杂联动、编辑器或任何规格模式无法表达的需求。模式选择只优化常见页面路径，不限制 React 的能力。
- 用户明确写出 React 或需求命中复杂能力时使用 `react`；普通查询列表默认使用 `ops-page-spec`。两种模式都遵循同一套 Change 目录、渐进式知识读取和人工浏览器检查规则。

### 常规列表快速路径

需求清晰且命中 `ops-page-spec` 时，以 7 分钟（420 秒）左右为目标完成首版交付。一次分发后，只读取返回的 always、family、命中的 onDemand 和 generate 资源，并在一个批次中完成独立读取；不要扫描其他页面族、历史 Change、Shell 维护参考或重新读取已确认内容。随后依次完成一次新 Change 脚手架、一次 `page-spec.json` 编写、一次规格校验和一次预览构建；`check-skill.mjs` 与规格校验可并行，构建只在两者通过后执行。

常规页面不重编译 vendor、不安装依赖、不启动浏览器。输入未变化时不重复运行通过的检查；只有失败或输入发生变化时才重跑对应步骤。7 分钟目标适用于本地规格模式的脚本与一次作者交互，不把人工浏览器验收、复杂 React 页面、依赖安装或公共框架维护编译计入该目标。交付时以 `preview-build.json.timingsMs` 报告脚本构建耗时，模型编写和工具往返耗时单独说明，不能把它们归因给脚本。

公共生成接口见 [Shell 契约](modules/operations/shell/shell-contract.md)。Shell 的实现、截图和维护细节仅在修改框架或排查问题时读取。模板示例只在需要组件用法参考时定向读取。

## 设计与行为约束

具体规则以以下唯一维护文件为准，不在入口重复完整规范。用户明确需求优先于 DEFAULT 和 GUIDE；REQUIRED 要求仍需满足。

| 关注点 | 规则来源 |
| --- | --- |
| 布局、颜色、按钮、单位、字体、间距、表格与抽屉默认值 | [基础视觉](modules/operations/design-system/director-rules/01-visual-foundations.md)，属于 always |
| 组件 API、主题和公开接口 | [Ant 规范](references/antd-components.md)，属于 always |
| 浮层、独立页、多模块和工作台组合 | [页面组合](modules/operations/design-system/director-rules/02-page-composition.md)，按需 |
| 保存、校验、加载、取消、失败恢复和真实反馈 | [交互质量](modules/operations/design-system/director-rules/03-interaction-quality.md)，按需 |
| 特定页面族 | 分发器命中的 page-pattern 与 context pack |

- 菜单、Table、Form、Modal、Drawer、反馈等标准控件用真实 Ant Design；结构容器可用 HTML/CSS，不手写仿 Ant 控件，不改用整套 ProLayout。
- 两种模式必须使用同一份 `PlatformShell`、`PlatformProvider`、查询、表格、工具栏、浮层公共组件及样式；规格模式通过预编译包直接复用，不另写简化框架，不降级组件库。共享包由 React 模板锁定的依赖编译。
- 样式数值来自 [platform.config.json](modules/operations/platform.config.json)，公共框架来自 `modules/operations/shell/`，业务代码只定义局部布局。Shell 统一提供导航、页签、搜索、全屏和个人中心；只注册实际生成的页面。
- 状态、查询、保存、查看、导出等可见操作必须有真实前端行为。无接口时使用 mock 数据适配器，不虚构接口、权限或后台调度。
- mock 范围、假设和未接入能力写入契约及 review.md；页面内不默认显示“本地演示”“刷新恢复”等实现说明，必要业务错误和结果反馈保留。
- 只有影响实现且无法推断的信息才询问；可逆的布局和演示假设直接采用合理默认并记录。

## 实现

按 [页面契约](modules/operations/execution/page-contract.md) 编写 React 项目的 `page-spec.json`。独立项目初始化：

```bash
node <skill-root>/scripts/scaffold-page.mjs --out changes/YYYYMMDD-名称 --request-file <request.txt>
node <skill-root>/scripts/prepare-preview.mjs --project <absolute-change-path>
```

脚手架复制当前 Shell、配置和构建工具，默认只留一个待编写的页面入口，不带商户示例。要查看组件示例时可用 `--with-examples`。它不能把需求自动变成成品：必须编写 `src/pages.tsx`、`src/data/`，同步 `page-spec.json`、路由和项目配置。

依赖准备检查当前项目、匹配的共享缓存，再按锁文件安装到 skill 的 `.cache/dependencies/`；缓存按依赖、锁文件和运行环境区分。新用户没有缓存时需要一次准备，后续新 Change 可链接同一缓存。默认使用本地包缓存，缺包明确报告；确需联网时显式使用 `--allow-network`。安装总超时 60 秒、单次请求超时 10 秒，不自动重试；成功后验证依赖和 Vite，再链接到 Change。HTML 使用者直接打开物料，无须安装 Node 或依赖。详见 [frontend.md](modules/operations/frontend.md)。

生成使用自然语言判断与 React 编码，规则、Shell 和依赖按需复用；不为加速删减质量规则、把复杂需求限制成固定配方，或跳过必要检查。

常见列表优先使用规格模式。初始化时：

```bash
node <skill-root>/scripts/scaffold-ops-page-spec.mjs --out changes/YYYYMMDD-名称 --request-file <request.txt>
```

补全 `page-spec.json` 后设置 `status` 为 `ready`，再执行：

```bash
node <skill-root>/scripts/validate-ops-page-spec.mjs changes/YYYYMMDD-名称/page-spec.json
node <skill-root>/scripts/build-ops-page-spec.mjs --spec changes/YYYYMMDD-名称/page-spec.json
```

也可以用统一收尾命令完成并行校验与构建：

```bash
node <skill-root>/scripts/finish-ops-page.mjs --change changes/YYYYMMDD-名称
```

它会根据 page-spec.json 自动选择规格模式或 React 模式；规格模式并行执行规格校验和技能检查后直接生成预览，React 模式在校验后准备本地依赖并构建。网络依赖只有显式传入 --allow-network 才允许安装。

规格模式不创建 Change 内的 `node_modules`，不执行 npm/pnpm，也不远程安装依赖。构建会把 skill 内维护的本地 Runtime、vendor 和 CSS 复制到该 Change 的 `preview-assets/`，生成可直接打开的 `preview.html`。新用户第一次也可以直接使用这条链路；只需填写规格，不需要准备 React 构建环境。公共框架或锁文件变更时，由技能维护流程运行 `scripts/build-spec-runtime.mjs --dependencies <已准备的项目或缓存目录>` 更新随技能分发的共享包；普通页面生成不运行此维护命令。构建前核对源码和包的指纹，过期则明确报错，不能静默回退到其他框架；主题配置每次从 `platform.config.json` 注入。规格模式的边界由需求决定，超出列表、查询、Modal、Drawer 的能力时切换 React。

## 静态检查与交付

React 业务代码与契约完成后执行，每项在输入未变化时只跑一次：

```bash
node <skill-root>/scripts/validate-page-spec.mjs <absolute-change-path>/page-spec.json
node <skill-root>/scripts/check-skill.mjs
# 工作目录为当前 Change
node scripts/build-preview.mjs
```

前两项可并行；构建内部并行跑 TypeScript 和 Vite，全部通过才生成 `preview.html`、`preview-assets/`、`preview-build.json`。失败先修正原因，仅重跑受影响的检查；不要对已知 draft 契约先跑校验。macOS 原生模块签名兼容处理封装在构建运行时中，不跳过任何检查。

`review.md` 简要记录实现假设、实际检查结果及待人工项，不重复整份需求或粘贴完整日志。复杂逻辑或重要回归才添加必要测试；不把每次生成变成全技能测试。

浏览器启动、截图和交互预检不属于默认生成链路。交付 `preview.html` 的绝对链接后，由用户人工检查；没有执行浏览器检查就写“待人工检查”，不等待用户验收后才交付。

规格模式的必需检查是 `validate-ops-page-spec.mjs`、`check-skill.mjs` 和 `build-ops-page-spec.mjs`；同样不启动浏览器。构建结束后交付 Change 内的 `preview.html`，其所有脚本、样式和 vendor 都应来自本地 `preview-assets/`。

## 时间与排障

`preview-build.json.timingsMs` 仅代表构建阶段。总耗时、模型编写、依赖安装、工具往返及没有工具活动的间隔分开表述；没有证据时不要把间隔归因于网络、模型、浏览器或 Token 数。累计输入 Token 包含多轮重复上下文，不能当作单次上下文长度。不要承诺每次固定几分钟。

优先减少误路由、重复读取、重复命令和返工。缓存与渐进读取能减少这些开销，无法单独保证模型服务响应时间。新增脚本或修改执行流程时运行 `node --test scripts/test-generation.mjs scripts/test-spec-runtime.mjs`，普通页面生成无须运行该回归套件。

## 修改技能

从 [CUSTOMIZE.md](CUSTOMIZE.md) 定位唯一维护入口，视觉改 director-rules、数值改平台配置、框架改 Shell、生成链路改脚本和 generation-policy。只有实现并验证后才将能力登记为 example；用户历史 Change 不自动批量覆盖。
