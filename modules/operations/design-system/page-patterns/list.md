# 列表页建议

任务顺序通常为筛选 → 查询结果与可选批量工具 → Table。只在需求有明确统计口径时增加指标。

默认查询页保持白底。用户要求列表动作打开新标签页时，只为目标业务页采用 [灰底白色模块布局](module-page.md)，来源查询页不改变；新标签页内单模块撑满可用内容区，多模块高度随内容适配。

查询条件默认使用 `PlatformQueryForm` 的 CSS Grid，列数为 3；只有用户明确要求时改为 4，不支持其他列数。条件之间的横向和换行纵向间距、页面区块间距读取 `platform.config.json.layout.elementGap`（默认 16px）。Form.Item 的 margin 设为 0，避免默认外边距与 gap 叠加。查询条件默认铺满网格，查询与重置等 `actions` 始终放在最后一列并右对齐；条件少时动作可与最后一项条件合并在同一行，条件填满时落到下一行最右侧。启用 `collapsible` 且条件超过列数时提供带方向图标的展开 / 收起按钮，收起仅显示首行；窄屏可退化为单列。按钮之间的横纵间距读取 `layout.buttonGap`（默认 8px），适用于查询操作、工具栏、表格行内操作和弹窗底部等按钮组。Space 通过平台 ConfigProvider 默认使用按钮间距；非按钮元素用 Space 时显式指定 `size={config.layout.elementGap}`。

查询区与表格区之间默认加 Ant Divider，1px 高、颜色取 `layout.queryDividerColor`（默认 rgba(0, 0, 0, 0.08)）。分割线上下分别留 16px：条件区 → 16px → 分割线 → 16px → 表格区。Divider 作为 page-stack 中独立的布局元素，margin 设为 0，避免默认外边距与 gap 叠加；无中间提示时条件区到表格合计 33px。错误或结果提示位于分割线后的结果区，同样保持 16px 区块间距。

Form 字段对应查询参数，查询/重置回第一页。Table 用稳定业务 ID 作 rowKey；总数对应实际过滤结果。空结果保留筛选和列标题。操作列选择 Drawer/Modal/独立页要依据任务长度与来源上下文。

列表行操作需要二次确认时，遵循 [INT-17](../director-rules/03-interaction-quality.md)：使用 `App.useApp().modal.confirm(withModalDividers(...))` 的 Modal 提示形态，保留黄色警示图标、标题/正文/底部区域分割线和右下角操作按钮；危险操作确认按钮使用 danger，不改为普通受控 Modal 或 Popconfirm。确认前不改变数据；取消、遮罩关闭或 Escape 不执行操作。

平台表格默认使用中号规格，显式设置 `Table size="middle"`，不只依赖 ConfigProvider 的 componentSize。列表默认在表格上方使用 `PlatformTableToolbar` 展示标题、刷新、密度和列设置；标题使用 16px 和 `theme.token.fontWeightStrong`（默认 500，中黑体），继承平台字体栈；标题到表格默认间距取 `layout.tableToolbarGap`（12px），用户可分别关闭。右侧三个设置按钮之间不额外增加 8px gap。业务主操作通过 `primaryAction` 使用 Ant `Button type="primary"`，辅助操作通过 `secondaryActions` 使用普通 Ant `Button`，不使用 link / text 按钮；主操作紧邻三项设置左侧，辅助操作按顺序排列在主操作左侧，业务按钮之间及与设置组之间的间距均为 `layout.buttonGap`（8px）；隐藏标题或三项设置时，业务操作仍右对齐。密度下拉切换 `small / middle / large`，列设置用 Checkbox 控制可见列，刷新重新执行当前查询。只有用户明确要求其他密度时调整。此工具栏默认规则适用于普通查询列表；多模块页内的 Table 默认不显示独立标题、刷新、密度和列设置，按[模块页规则](module-page.md)处理。

表格状态字段默认使用 `PlatformTableValue` 的 Ant `Badge` 状态点并带文字，可切换为普通文字或 `Tag`；种类字段默认使用无颜色的 Ant `Tag`，用户明确要求彩色标识时再传入颜色，也可切换为普通文字。状态与种类的展示方式由字段配置控制，不能用颜色替代文字语义。

表格列默认左对齐。需要整体居中或右对齐时使用 `PlatformTable columnAlign="center"` / `"right"`，单列在 Ant column 上设置的 `align` 优先；因此可以整体调整后为操作列、金额列等保留单独对齐方式。不要用全局 CSS 覆盖表头或单元格对齐。

金额列按 [VIS-26](../director-rules/01-visual-foundations.md) 将单位统一写在表头“字段名(单位)”中，使用英文半角括号 `()`，单元格不重复单位；列设置名称与表头同步，混合单位按真实业务类型区分。

当表格内容可能超出内容区宽度时，操作列默认使用 Ant Table 的 `fixed: 'right'` 固定在右侧，并确保表格配置了 `scroll.x`（未显式配置时 `PlatformTable` 使用 `max-content`）。操作列优先识别 `title: '操作'`、`key/dataIndex: 'action'` 或 `key/dataIndex: 'actions'`；用户显式设置 `fixed` 时保留用户配置。其他列随内容横向滚动。

```tsx
<PlatformTable columnAlign="center" columns={[
  { title: '编号', dataIndex: 'id' },
  { title: '操作', key: 'action', align: 'left', render: renderActions },
]} />
```

表格区域的入口按钮、批量工具或局部操作放入 `PlatformTableToolbar.secondaryActions` / `primaryAction`，与默认标题及右侧刷新、密度、列设置并列；查询区只保留筛选与查询 / 重置动作，避免把表格行为混入条件网格。`extra` 保留为自定义内容的兼容插槽，位置在主操作之前。

表头和正文的字号、内边距使用同一规格；表头默认 500 中黑体，正文为 400 常规体，遵循 [VIS-25](../director-rules/01-visual-foundations.md)；默认主题的中号单元格内边距为上下 12px、左右 8px，不单独压缩表头。行内操作使用 Ant `Button type="link"` 配合共享 `table-action-link` 样式，去除按钮额外高度、边框与内边距，行高继承单元格，避免默认 32px 按钮撑高正文。该类通过局部 `border-width: 0 !important` 保持所有交互状态的零边框宽度，防止 Ant 的 hover/active 边框简写重新增加透明边框、挤高行并移动文字；保留组件的变色及焦点反馈。操作列内文字按钮之间固定使用 `layout.buttonGap`（默认 8px），React 实现必须给操作按钮组显式传入该间距，不能用 `size={0}` 覆盖平台默认值。操作列 `align: 'left'`，首个按钮文字与“操作”表头左边缘对齐。验收时检查表头、正文行高、按钮文字起点和按钮间 8px 间距，以及悬停前后尺寸与位置一致；多行内容按内容自然增高。

操作数量按**当前行实际可见的操作**计算，包含查看详情，互斥的启用 / 禁用只计当前可见的一项。少于 3 项时按顺序显示文字按钮；达到 3 项时默认首项直显，剩余操作按原顺序放入 Ant Dropdown 的“更多”菜单，危险操作保留危险态，需二次确认的操作使用统一的 `modal.confirm(withModalDividers(...))` Modal 提示形态。用户明确要求操作“不收起”或“全部展示”时，所有操作改为文字按钮，按原顺序每行最多 3 项，超过 3 项自动换行；列宽不足时同组操作也随可用宽度换行，窄屏仍可通过表格横向滚动查看。规格模式在 `list.table.actionDisplay` 设为 `"expanded"` 开启展开，省略该字段即使用默认收起规则；React 页面按相同行为实现。

批量操作说明作用范围，筛选变化后处理失效选择；导出说明当前页/选中项/全部结果并真正生成数据文件。没有后端时仅承诺本地演示范围。
