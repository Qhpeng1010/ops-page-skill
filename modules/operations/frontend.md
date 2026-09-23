# 前端执行约定

## 既有项目

复用项目 React、TypeScript、Ant 版本、路由、数据请求和构建工具；只迁入需要的规则和公共代码。宿主不是 React 时不擅自切换技术栈，确认兼容方案。不要覆盖已有 package.json、lockfile、路由或主题。

## 独立预览

生成前先通过 `node scripts/dispatch-ops-page-command.mjs --request "<原始需求>"` 选择页面族；只读取返回的页面模式和按需规则。Shell 契约是公共输入，Shell 源文件只在公共框架变更时读取。

`scripts/scaffold-page.mjs` 将 `assets/frontend-template/` 和 `modules/operations/shell/` 组合为独立项目，复制平台配置到 `src/platform/`。需要 Node 20.19+ 或兼容的较新版本。相对 `--out` 会固定落在 `ops-page-skill/changes/`，与命令从哪个目录执行无关。

常见列表也可以使用 `ops-page-spec`：`scripts/scaffold-ops-page-spec.mjs` 只创建 `request.txt`、`page-spec.json` 和 Change 目录，`scripts/build-ops-page-spec.mjs` 直接复制 `modules/operations/runtime/` 下的 Runtime、CSS 和 vendor 到 `preview-assets/`。该模式不创建 `node_modules`，不运行包管理器，预览只使用 Change 内的本地文件；它与 React 模式共用 `modules/operations/shell/` 的组件、CSS、平台配置与锁定的依赖版本。vendor 由维护命令 `scripts/build-spec-runtime.mjs --dependencies <已准备项目或缓存>` 预编译并随技能分发；正常生成只检查来源指纹和复制，不重新编译、不另画框架。复杂需求仍使用下方的 React 工具链。

```bash
node /absolute/path/ops-page-skill/scripts/scaffold-page.mjs --out ./changes/merchant-query --request-file ./request.txt
node /absolute/path/ops-page-skill/scripts/prepare-preview.mjs --project ./changes/merchant-query
# 只有本地缓存缺包且确实需要安装时才显式允许一次联网安装
# node /absolute/path/ops-page-skill/scripts/prepare-preview.mjs --project ./changes/merchant-query --allow-network
cd ./changes/merchant-query
node scripts/build-preview.mjs
# 产物在当前 Change 目录：preview.html、preview-assets/、preview-build.json
# 需要服务方式预览时，在当前 Change 目录运行：pnpm run dev --host 127.0.0.1
```

`prepare-preview.mjs` 检查当前项目依赖，再复用按依赖声明、锁文件、环境生成的 `.cache/dependencies/<key>/` 缓存；旧的 preview 缓存仅在身份匹配时兼容复用，不是必备目录。首次无缓存时按锁文件安装到 skill 内的缓存，健康检查通过后链接到 Change。新用户和已有用户走同一逻辑，仅首次是否安装不同。缓存过期或链接失效会明确报错，不向其他项目的链接目录直接安装。

默认仅使用本地包缓存；缺包需显式 `--allow-network` 才尝试联网。单次 fetch 超时 10 秒，整个安装进程超时 60 秒，失败不自动循环重试。安装后必须验证必备依赖和 Vite 可用才报告完成。新请求创建新 Change；修改同一页面才复用其源码，匹配的依赖缓存可以跨 Change 共用。

初始模板示例继续保留在技能中作为按需参考，默认脚手架不复制其商户业务代码或示例导航，只生成待编写入口和空 data 目录。显式 `--with-examples` 可复制示例以复核组件。两种方式都不复制 `.DS_Store`、node_modules、dist、preview-assets 或缓存。

生成时按需求编写 `src/pages.tsx` 与页面组件，同步 `platform.config.json.projects` 和 `projectKeys`，无需先阅读再删除整套示例。源码与契约完成后才执行必需检查；TypeScript 和 Vite 并行通过后打包 HTML。`preview.html` 与同目录资源可供产品、后端直接打开，无需 Node、包管理器、依赖链接或本地服务器。只有编辑/重新构建源码才需要依赖准备。

页面主入口 `src/main.tsx`，公共框架 `src/platform/PlatformShell.tsx`，业务页面 `src/pages.tsx`，数据适配器在 `src/data/`。业务代码不得反向导入技能目录的绝对路径。

框架按项目记忆已打开页签与当前页，使用 sessionStorage 和 URL hash；不保存业务敏感数据。同一项目页签内页面保持挂载，切换时保留表单和查询；跨项目切换先调用已打开页的 `canClose()`，通过后卸载原项目页面。跨项目返回、关闭或刷新后的业务状态恢复由页面按需求实现。

新增业务能力由助手编写和验证 React 代码，本版没有通用 JSON 到 UI 编译器、PRD 引擎或服务器接口。不要声称运行脚手架就已按自然语言完成页面。
