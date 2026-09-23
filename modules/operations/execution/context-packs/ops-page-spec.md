# Ops Page Spec Context

用于常见运营后台列表：查询条件、表格、分页、列表内新增 Modal、列表内详情 Drawer，以及有限的行操作。

- `page-spec.json` 是唯一业务源文件，必须设置 `status: "ready"` 后再构建。
- `scripts/scaffold-ops-page-spec.mjs` 只创建 Change 和规格草稿，不安装 Node 依赖。
- `scripts/validate-ops-page-spec.mjs` 检查规格契约；`scripts/build-ops-page-spec.mjs` 使用 skill 内的 Runtime、CSS 和 vendor 生成 `preview.html`。
- 规格模式的预览只引用 Change 内 `preview-assets/`，vendor 来自 `modules/operations/runtime/vendor/`，不访问 CDN，也不依赖 Change 内 `node_modules`。
- 页面超出列表、查询、Modal、Drawer 的表达能力时切换 React 模式；React 模式仍按原有独立项目和本地依赖缓存构建。

- **公共框架保持一致**：Runtime 只解释业务规格，页面由共享 `PlatformProvider` + `PlatformShell` 注册；查询、表格、工具栏、详情与新增布局使用 Shell 公共组件。不得为规格模式复制一套导航、页签、主题或查询 CSS。
- vendor 是从公共 Shell 源码与 React 模板锁文件预编译的本地包，随 skill 一起分发。构建核对来源指纹及资源摘要，版本不匹配时停止，不能回退到旧 Ant 或简化框架。正常生成不编译 vendor。
- `platform.config.json` 在生成时注入，主题、字体、布局配置与 React 保持同源。只注册本页所属项目，不生成空菜单。
- 公共源码维护才读取 [Shell 维护](../../shell/shell-maintenance.md)，日常列表生成不扩展读取范围。
