# Ant Design 组件规范

## 版本与来源

先读项目 package.json 和 lockfile，再检查实际安装版本的类型定义。不混用 React Ant Design、Ant Design Vue、Ant Design Mobile。既有项目不为套模板自动升级主版本。

独立启动模板采用 React 19、Ant Design 6；版本范围在模板 package.json，安装后保留 lockfile。官网在 2026-09-15 查阅时显示 6.6.4；不能据此假设旧项目也支持该 API。

权威入口：[组件总览](https://ant.design/components/overview-cn/)、[主题定制](https://ant.design/docs/react/customize-theme-cn/)、[设计原则](https://ant.design/docs/spec/introduce-cn/)、[从 v5 到 v6](https://ant.design/docs/react/migration-v6-cn/)。v5 项目查阅 [v5 文档](https://5x.ant.design/)。在线资料不可用时以已安装包类型为准，记录未确认项。

## 需求到组件

| 语义 | 官方组件 | 实现注意点 |
| --- | --- | --- |
| 侧栏层级导航 | Menu | items、selectedKeys、openKeys 关联真实页面，不手写高亮列表 |
| 页面位置与工作区 | Breadcrumb、Tabs | 菜单、页签、面包屑来自同一路由注册信息；关闭页签有回退 |
| 顶部工具与账户入口 | Button、Tooltip、Dropdown、Avatar、Input、Modal | 搜索、全屏、个人中心必须有真实行为；图标按钮有 aria-label 和 Tooltip，用户菜单用 Dropdown，搜索结果可跳转页面 |
| 筛选和录入 | Form、Input、InputNumber、Select、DatePicker、TimePicker | label、校验和受控值统一；数值精度和日期时区随业务 |
| 枚举与层级选择 | Radio、Checkbox、Switch、Cascader、TreeSelect | 单选、多选、开关和树形语义对应，不用可点击 div 替代 |
| 数据表 | Table（内置 Pagination） | 稳定 rowKey；分页、排序、筛选明确是前端还是后端；不重复分页 |
| 状态和标签 | Badge、Tag | 使用语义状态并带文字，品牌色不能替代业务状态 |
| 内容详情 | Descriptions、Typography、Tabs、Timeline | 标签和内容对齐，ID 支持复制时用 Typography |
| 上下文任务 | Modal、Drawer、Popconfirm | open 受控；生命周期 API 按版本；异步关闭等待结果 |
| 列表行操作二次确认 | `App.useApp().modal.confirm` | 参数先交给 `withModalDividers`，使用统一的 warning Modal 提示形态；不改用普通受控 Modal 或 Popconfirm |
| 行为反馈 | App 的 message、notification、modal；Alert、Result、Empty、Spin、Skeleton | 强度与任务匹配；错误不冒充空数据 |
| 文件和步骤 | Upload、Steps、Progress | Upload 接真实适配器或明确本地选择；Steps 不自行提供流程引擎 |
| 统计与结构容器 | Statistic、Card、Divider、Space、Flex、Row/Col | 不用 Card 装饰每个区域；Flex API 需版本支持 |

表不是白名单，其他标准控件同样使用当前版本 Ant 官方组件。[Ant Design Charts](https://ant-design-charts.antgroup.com/) 与 ProComponents 是独立库，不能从 antd 导入不存在的图表或 ProTable。专业能力按需接入并确认兼容性。

## 主题与组件 API

- 标准组件从 `antd` 导入，图标从 `@ant-design/icons` 导入，不复制 vendor 或自己描摹组件。
- 导航菜单的业务图标统一使用 Ant 面性（`Filled`）图标；二级菜单保持纯文字。展开箭头、折叠按钮等交互指示保留组件原有语义。
- 按钮默认纯文字；只有用户明确要求时才使用 `Button.icon` 或在按钮内添加业务图标。保留 `loading` 反馈以及组件自身的关闭、翻页、展开指示和已约定的 Shell 图标，不能用全局 CSS 一并隐藏。
- 按钮组间距统一为 `layout.buttonGap`（默认 8px），适用于查询、工具栏、表内操作及 Modal/Drawer 底部；使用 Ant Space/Flex 排列，按钮换行也保持 8px。条件和页面区块间距使用独立的 `layout.elementGap`（默认 16px）。
- 侧栏导航仅选中的二级菜单文字使用主题色；一级分组通过菜单项自己的 className 与语义属性选择器指定 `Menu.darkItemColor`，文字、面性图标和箭头均不随下级选中而高亮。
- 全局使用 `ConfigProvider theme={...}`；子组件通过 `theme.useToken()` 消费派生颜色、间距、字体等。
- 字体沿用平台 `theme.token.fontFamily` 的标准系统字体栈，使用 Ant 组件主题继承到 Modal / Drawer；默认不添加机器专用字体别名。异常排查和兼容移除遵循 [VIS-25](../modules/operations/design-system/director-rules/01-visual-foundations.md)。
- 平台主题主色统一读取 `modules/operations/platform.config.json` 的 `theme.token.colorPrimary`（当前为 `#1890FF`），页面不得另设主色 Token。查询条件、Form 字段、按钮、label、Table 正文单元格等普通文字默认 `font-weight: 400`；所有语义加粗使用 `theme.token.fontWeightStrong=500`（PingFang SC Medium / 中黑体），Table 表头同步 `theme.components.Table.fontWeightStrong=500`，主列表和详情内表格一致。不要用页面 CSS 改成 600 或 bolder。
- 平台数据表默认显式设置 `Table size="middle"`，保证中号行密度；不要仅依赖全局 componentSize。
- 操作列左对齐；表内链接操作使用 Ant Button 配合 `table-action-link`，移除按钮额外高度和内边距，继承单元格行高，避免按钮撑高正文或使操作文字右移。共享类局部固定 `border-width: 0 !important`，避免 Ant hover/active 的边框简写恢复 1px 透明边框；不改变其他按钮的边框或移除焦点提示。表头、正文规格及操作悬停前后的行高和文字位置都要检查。
- 查询列表条件使用 Ant `Form.Item` 放入 `PlatformQueryForm` 的 CSS Grid；平台列数仅允许 3 或 4，操作区通过 `actions` 固定到最后一列并右对齐。展开 / 收起使用带方向图标的 Ant `Button`，条件超过列数时才显示；查询区之外的业务操作通过 `PlatformTableToolbar.secondaryActions` / `primaryAction` 放入表格工具栏。
- `ConfigProvider` 外层、`App` 内层。`message.xxx` / `Modal.xxx` 等静态方法可能丢失上下文，统一使用 `App.useApp()`；如此弹层也继承平台主题与语言。
- Drawer 标题默认左对齐，关闭按钮固定在标题栏最右侧；使用 Ant Drawer 公开的 `closable={{ placement: 'end' }}`，不要通过内部类名或绝对定位调整。
- 详情 Drawer 的内容区使用 Ant 默认 body padding，四边均为 `24px`；不要把平台详情 Drawer 的 body padding 改成 12px 或只覆盖单侧。详情分组标题到字段内容的间距另遵循 `layout.detailTitleGap`。
- Drawer footer 中的按钮始终右对齐；多个操作按“辅助按钮在左、主按钮在最右”排列。只读详情 Drawer 默认通过 `footer` 提供右侧辅助按钮“关闭”，按钮调用同一 `onClose` 逻辑；编辑或提交型 Drawer 根据业务增加操作，按钮组使用 Ant `Space` 并遵循 `layout.buttonGap`。
- Modal 默认点击遮罩关闭；Ant 6 显式设置 `mask={{ closable: true }}`，`App.useApp().modal.info/confirm` 等方法同样设置 `mask: { closable: true }`，不依赖它们各自的默认值。只有用户明确要求时设为 false；旧版本按公开 API 使用 `maskClosable`。遮罩关闭走 onCancel，未保存内容处理与取消一致。
- Modal 禁止标题副描述、示例说明和引导段落。标题下方、操作区上方默认带 1px 通栏灰线，颜色取 layout.modalDividerColor；线两侧各留 layout.modalDividerGap（默认 16px）。普通 Modal 由平台 ConfigProvider 注入 header/footer 语义 classNames 和间距；需要统一分割线、警示图标和底部操作区的 Ant 方法弹窗通过 [withModalDividers](../modules/operations/shell/modalDividers.tsx) 适配，列表行操作二次确认同样必须使用该适配。必要字段提示、校验、提示 / 确认的核心业务正文及原有交互保留，不依赖内部 DOM 类名。
- Modal / Drawer 表单使用 `PlatformOverlayFormGrid` 时，字段行间和列间统一为 `layout.elementGap`（16px），单列字段的纵向间距也为 16px；多列表单中的长字段使用 `platform-overlay-form-wide` 占满整行。
- 普通查询列表表格上方使用 `PlatformTableToolbar`：Ant Button + Tooltip 提供刷新，Dropdown 提供密度和列设置，Checkbox 控制列显隐；标题、刷新、密度、列设置默认显示，用户可以通过对应 `show*` 参数分别隐藏。刷新必须调用真实查询或数据适配器，密度和列显隐由页面状态控制。
- 表格工具栏标题使用 16px 和 `theme.token.fontWeightStrong`（默认 500，中黑体），继承平台字体栈；标题到 Table 默认间距为 `layout.tableToolbarGap`（12px）。刷新、密度、列设置三个默认按钮之间不追加 8px gap。业务主操作使用 Ant `Button type="primary"` 传入 `primaryAction`，辅助操作使用普通 Ant `Button` 传入 `secondaryActions`，不使用 link / text 按钮；辅助操作按顺序位于主操作左侧，主操作紧邻三项设置左侧，业务按钮之间及与设置组之间的间距均为 `layout.buttonGap`（8px）。`extra` 仅作为兼容性的自定义插槽。
- 表格列默认左对齐；需要按页面整体调整时使用 `PlatformTable columnAlign="center"` 或 `"right"`，单列的 Ant `align` 优先覆盖整体默认值。不要通过全局 CSS 强制 `th` / `td`，以保留每列自主配置能力。
- 表格发生横向溢出时，操作列固定在右侧。使用 `fixed: 'right'` 并配置 `scroll.x`；`PlatformTable` 会识别标题为“操作”或 `action` / `actions` 键的列自动补齐，用户显式设置 `fixed` 或 `scroll` 时保留用户配置。
- 状态值默认使用 `Badge` 状态点加文字；种类值默认使用无颜色 `Tag`，明确需要彩色标识时传入 `color`。通过 `PlatformTableValue` 的 `display` 可将状态切换为普通文字 / Tag，将种类切换为普通文字，原始值和语义保持不变。
- 新标签页的白色模块用 [PlatformModule](../modules/operations/shell/PlatformModule.tsx)（Ant Card）承载，正文自由组合 Form、Steps、Descriptions 等。布局选择见 [模块页规则](../modules/operations/design-system/page-patterns/module-page.md)；模块标题默认无副描述，只有明确需要时传 description。
- 多模块页的详情使用 `PlatformModuleDescriptions`（Ant Descriptions），默认 `column=3`、行间距 `layout.moduleDetailRowGap=12px`。相邻详情模块传 `detail`，由公共 Shell 使用灰色分割线分隔，模块标题下不重复放线。模块内 Table 默认不传 `title`、不添加 `PlatformTableToolbar`；用户要求工具时仅启用指定 `show*` 项。含 Table 的模块显式设置 `PlatformModule hasTable`，自动去掉标题下分割线和标题到表格顶部的 16px 留白，保留模块标题和 Table 自身表头、行分隔线。
- 多模块表单使用 `PlatformModuleFormGrid`（CSS Grid + Ant Form.Item），父级 Form 默认 `layout="vertical"`、3 列，列间和行间为 `layout.elementGap`（16px）；新增 / 编辑页使用 `PlatformPageFooter` 提供吸底操作栏，详情展示默认不显示。footer 操作区右对齐，辅助按钮在左、主按钮在最右，使用 Ant `Space` 和 `layout.buttonGap`。
- 组件定制优先 `theme.components`，其次当前版本公开的语义 DOM styles/classNames。不要依赖内部 DOM 类名或过时属性；例如 Drawer/Modal 的 width、size、销毁参数先核对安装版本。
- Form 接管值和校验：Checkbox/Switch 注意 valuePropName；动态初始值使用表单实例；条件字段明确隐藏后清值还是保留。
- 不因“全部用 Ant”强制把普通 section、main、CSS Grid 换成整套后台框架。容器负责布局，交互行为由官方组件承担。

多模块业务分类切换使用 `PlatformModule.tabs`（Ant `Tabs`），默认 type="line"、tabPlacement="top"，位置由模块组合决定；不混用工作区可关闭 Tabs 的样式。同一模块有 Tabs 时默认不显示 title / description，仅明确要求标题下子 Tabs 时设置 tabsMode="subtabs"；extra 自动进入 Tabs 操作区。顶部 Tabs 与第一个模块的正文放在同一 Card 内，不拆独立导航卡片。默认不销毁已访问内容。页面范围用受控 activeKey/onChange，模块范围用 items.children，按需求保留共享筛选及输入。规则详见 [模块页布局](../modules/operations/design-system/page-patterns/module-page.md)。
