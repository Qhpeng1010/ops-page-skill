# 运营后台 Core Context

只在每次生成开始读取这一包。它覆盖业务域、平台配置、基础视觉规则和 Ant 组件约定。

- 业务域：`modules/operations/DOMAIN.md`
- 平台配置：`modules/operations/platform.config.json`
- 基础视觉：`modules/operations/design-system/director-rules/01-visual-foundations.md`
- Ant 组件：`references/antd-components.md`

页面组合和交互验收不属于每次生成的核心包：分发器只在需求命中时读取
`director-rules/02-page-composition.md` 和 `director-rules/03-interaction-quality.md`，保持渐进式加载。

页面默认复用 `modules/operations/shell/` 的 PlatformShell。Shell 是框架输入，不随需求重绘；独立项目读取简短 Shell 接入契约，只有改变公共框架时才读取维护参考和源文件。所有标准交互使用 Ant Design。业务数据未接后端时，将 mock 与持久化范围写入 `page-spec.json` 和 `review.md`；页面内的演示或实现说明仅用户明确要求时添加（见 `director-rules/03-interaction-quality.md` 的 INT-09）。
