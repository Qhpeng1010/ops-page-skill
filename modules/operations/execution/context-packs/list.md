# 运营后台 List Context

命中查询列表、搜索、表格或管理后台时读取。只加载本页模式和列表规则，不读取其他页面族。

- 页面模式：`modules/operations/design-system/page-patterns/list.md`
- 查询与表格复用 `PlatformQueryForm`、`PlatformTableToolbar`、`PlatformTable` 和 `PlatformTableValue`
- 需要查看详情时在列表上下文中按需使用 Ant `Drawer`，详情 Drawer 加 `platform-detail-overlay`；需要新增时按需使用 Ant `Modal` 或独立页，不改变 Shell
- 复杂审批、模块页、特殊交互只在需求明确涉及时再读取对应 onDemand 规则
