# 基础视觉规则

REQUIRED 为交付质量要求；DEFAULT 可按明确需求调整；GUIDE 为判断依据。平台偏好不升级为不可修改的硬规则。

这是平台视觉规则的唯一维护入口。数值写入 `modules/operations/platform.config.json`，本文件只规定它们的使用方式；`CUSTOMIZE.md` 只做定位索引，不复制本文件内容。

| 编号 | 等级 | 规则 |
| --- | --- | --- |
| VIS-01 | REQUIRED | 菜单及全部标准控件用 Ant 官方实现，保留键盘、焦点、禁用、校验与浮层行为。 |
| VIS-02 | DEFAULT | 左侧深色导航，顶部白色工具栏与面包屑，其下页签，主体全宽。业务页不嵌套第二套导航。 |
| VIS-03 | REQUIRED | 公共样式用平台配置和 Ant Token，不通过全局 `.ant-*` 重做皮肤。必要兼容修复局部限定并说明原因。 |
| VIS-04 | DEFAULT | 按任务、筛选/操作、结果建立层级；同一区域优先一个主操作。查询用 primary，重置用 default，危险动作用 danger。 |
| VIS-05 | DEFAULT | 基础字号和间距取当前主题；标题通常用 Ant 的 20px 层级、区块标题 16px、正文 14px，代码消费 token 而非重复维护数值。 |
| VIS-06 | DEFAULT | 同类信息对齐，文本左对齐、金额和可比较数值右对齐；Table 金额列的单位展示遵循 VIS-26。状态带文字，长内容可展开、复制或局部滚动。 |
| VIS-07 | DEFAULT | 表格和详情区域使用可用宽度；表单内部阅读列可限制行长。不为大屏拉大控件，不无目的套多层 Card。 |
| VIS-08 | REQUIRED | 文字与背景保持可读对比度；控件保留焦点和可访问名称，唯一操作不能只在 hover 出现。 |
| VIS-09 | DEFAULT | 窄屏侧栏变 Ant Drawer，筛选换行，表格局部横向滚动，不隐藏唯一主操作。 |
| VIS-10 | GUIDE | 标题和帮助文案服务于任务；面包屑和页签已表达名称时可省重复标题。不生成装饰性统计或无关副标题。 |
| VIS-11 | DEFAULT | 菜单（含一级、二级和项目列表）与面包屑使用常规字重 400，选中或展开不加粗。导航中仅选中的二级菜单文字使用主题色；一级菜单文字、面性图标和箭头保持 Menu.darkItemColor，不随下级选中变色。主色统一读取平台 colorPrimary。 |
| VIS-12 | DEFAULT | 全局按钮默认使用纯文字，只有用户明确要求时添加图标。适用于查询、重置、新增、编辑、保存、导出等操作；保留 loading 反馈、组件自身的关闭 / 翻页 / 展开指示及用户已明确约定的 Shell 图标。 |
| VIS-13 | DEFAULT | 页面元素、区块和查询条件的横纵间距为 layout.elementGap（默认 16px）；按钮之间单独使用 layout.buttonGap（默认 8px）。Form.Item 与布局 gap 不叠加。查询列表在条件与表格之间默认放一条 1px 淡灰 Ant Divider，颜色由 layout.queryDividerColor 维护，分割线上下各留 16px。组件内部尺寸、菜单与页签的专门约定沿用各自规范。 |
| VIS-14 | DEFAULT | 弹窗禁止标题副描述、引导段落和示例能力说明；必要字段提示、校验信息和提示 / 确认弹窗的核心业务正文保留。普通 Modal 与列表行操作二次确认的 `modal.confirm` 均使用统一 Modal 提示形态：警示图标、标题区、正文区和底部操作区按 1px 通栏分割线组织，线两侧各留 `layout.modalDividerGap`（默认 16px），颜色为 `layout.modalDividerColor`；确认按钮位于右下角，危险操作使用 danger。方法弹窗统一通过 `withModalDividers` 注入 warning 图标和分割线；无标题或无操作区不补空区域。 |
| VIS-15 | DEFAULT | 首页、默认查询列表为白底；明确要求的新标签页采用 layout.newTabBackground（默认 #EAEDF0）灰底与白色模块，四周 layout.newTabPadding（默认 12px）。单模块至少撑满可用内容区，多模块高度随内容适配，间距取 layout.newTabModuleGap（默认 12px）。模块标题带主题色竖条，默认不带副描述，仅按用户需要添加。 |
| VIS-16 | DEFAULT | 顶栏默认提供 Ant 搜索、全屏和个人中心工具；搜索跳转可见注册页面，全屏切换浏览器全屏，个人中心打开 Dropdown 资料 / 偏好菜单。图标按钮保留可访问名称和 Tooltip，自定义工具追加在默认工具之后。 |
| VIS-17 | DEFAULT | 普通查询列表 Table 默认配套 PlatformTableToolbar：标题、刷新、密度、列设置默认显示，使用 Ant Button / Tooltip / Dropdown / Checkbox；用户可分别隐藏，状态由业务页面维护。工具栏标题使用 16px、500 字重，字体继承平台字体栈（中文在 macOS 上优先匹配 PingFang SC Medium / 中黑体）；工具栏业务主操作使用 primary Button，辅助操作使用普通 Button，不用 link / text 样式；从左到右为辅助操作、主操作、三项设置，业务按钮间距 8px。 |
| VIS-18 | DEFAULT | 多模块按需支持 Ant 线型业务 Tabs：默认与第一个内容模块融合，也可按用户要求放入任一模块；同一模块标题与 Tabs 二选一，仅明确要求标题下子 Tabs 时才并存。常规字重，选中文字和下划线随主题色。切换范围可为模块组或当前模块正文，位置与状态按业务决定。单模块不默认添加 Tabs。 |
| VIS-19 | DEFAULT | 查询条件默认使用三列网格，仅允许按需求切换为四列；启用展开 / 收起时，超过当前列数的条件隐藏在首行之后。查询和重置动作始终位于条件区最右列并右对齐，条件不足一行时可与最后一项条件共行；窄屏降为单列。 |
| VIS-20 | DEFAULT | 表格工具栏标题到表格默认间距为 layout.tableToolbarGap（12px）；刷新、密度、列设置之间不追加 8px gap。状态型字段默认 Badge 状态点加文字，种类型字段默认无颜色 Tag，明确需要彩色标识时才传入颜色；均可按字段切换为普通文字，状态还可切换为 Tag。 |
| VIS-21 | DEFAULT | 多模块页内 Descriptions 默认三列，行间距为 layout.moduleDetailRowGap（12px）。相邻详情模块之间使用灰色分割线，模块标题下不重复放线；详情抽屉及同一内容容器内的分组，分割线上下各留 layout.elementGap（默认 16px），内容和下一模块标题不能贴线。实现必须使用 `.page-stack` + 相邻 `.platform-detail-section`，不要在模块标题下手动插入 Ant Divider。Table 默认不带独立标题及刷新、密度、列设置，用户明确要求时按项开启；含 Table 的模块设置 hasTable，去掉标题下分割线和标题到表格顶部的 16px 留白，保留模块标题及表格自身分隔线。 |
| VIS-22 | DEFAULT | Drawer 标题栏左右分布：标题左对齐，关闭按钮固定右侧；footer 按钮右对齐，辅助按钮在左、主按钮在最右；使用 Ant Drawer `closable={{ placement: 'end' }}`，不依赖内部类名定位。 |
| VIS-23 | DEFAULT | 多模块表单使用纵向标签和 3 列网格，列间 / 行间为 16px；新增 / 编辑页默认有全局吸底操作栏，详情页默认无；吸底栏按钮右对齐，辅助在左、主按钮在最右。 |
| VIS-24 | DEFAULT | 表格内容横向溢出时，操作列固定在右侧；使用 PlatformTable 的操作列识别与 Ant Table `fixed: 'right'` / `scroll.x`，显式列配置优先。 |
| VIS-25 | DEFAULT | 查询条件、表单、按钮、label、Table 正文单元格等普通文字使用常规体 400；所有语义加粗统一使用 `theme.token.fontWeightStrong=500`（PingFang SC Medium / 中黑体）。Table 表头显式使用 `theme.components.Table.fontWeightStrong=500`，主列表和详情内表格一致，不用普通文字 CSS 覆盖表头。Modal / Drawer 表单使用 PlatformOverlayFormGrid 时字段上下和列间均为 16px。 |
| VIS-26 | DEFAULT | Table 金额列将整列共用的单位紧接字段名放在表头，表头统一使用英文半角括号 `()`，如“订单金额(元)”“退款金额(元)”；单元格只显示数值，不重复 ¥、元等符号或单位。金额精度、千分位与空值沿用业务约定，缺失值不当作 0。主列表、详情内表格与列设置名称保持一致。混合币种或金额 / 折扣时不能误标为单一单位：按业务拆列，或在表头列出单位并以类型字段明确对应关系，如“优惠金额(元/折)”对应满减券 / 折扣券；不得把折扣当作金额换算。此规则只调整表格展示，不改变存储值、计算或表单与非表格详情的单位表达；用户明确要求其他方式时按需求调整。 |
| VIS-27 | DEFAULT | 列表每行按实际可见操作数决定形态：3 项及以上默认首项直显、其余进入 Ant Dropdown“更多”；用户明确要求全部展开时，文字按钮每行最多 3 项，超过后换行。具体顺序、确认行为和规格字段见[列表页规则](../page-patterns/list.md)。 |
| VIS-28 | DEFAULT | 详情 Drawer 使用 `platform-detail-overlay` 语义类：Drawer 内容区四边使用 Ant 默认 `24px` body padding；详情分组标题到自身内容的间距使用 `layout.detailTitleGap`（默认 12px）。Modal 沿用现有标题分割线、正文留白和底部操作区标准；详情分组之间仍使用 `16px → 1px 灰线 → 16px`，不在标题下增加分割线。 |
| VIS-29 | DEFAULT | 普通表单 Modal 保留 Ant 的 header / body / footer 三个语义区域：标题只放 header，字段和校验只放 body，操作按钮只放 footer。容器内边距为 24px，表单 body 末尾到 footer 分割线前保留 24px；按钮之间使用 `layout.buttonGap`（默认 8px）。 |

## 维护边界

字体默认使用 `theme.token.fontFamily` 中的标准系统字体栈，页面、模板和弹层通过平台 Provider 继承。默认不添加 `@font-face` 本地别名、不复制个人字体、不强制某个平台的 PostScript 名称；用户指定品牌字体或已确认的未解决环境冲突需要兼容时，再限定范围处理并记录移除条件。环境修复且目标浏览器实际匹配恢复后再清理临时映射，不能只凭系统字体查询成功认定页面已修复。不同系统的实际字体名称可以不同，字体栈保留跨平台回退。

字体排查只在用户报告异常或明确要求字体验收时进行，不加入默认浏览器预检。`font-weight: 400` 仅是请求字重，需结合实际字形、Rendered Fonts、字体来源及回退判断；文件名也不等于真实字重，本地副本有冲突时再核对 OS/2 和各平台名称表。不要通过降到 300、透明度、描边或平滑属性掩盖错误匹配，不自动修改系统字体。中文、数字、label、按钮、表头和正文需按各自语义检查，不能将所有内容一律设为 400。

字体安装、停用或删除后，正在运行的浏览器可能仍缓存旧字体。若系统注册已更新，Rendered Fonts 却仍出现旧名称，先确认是否完全退出并重新启动过承载预览的浏览器 / 桌面应用；刷新页面或关闭页签不等于重启进程。重启后再核对实际字形，确认前将浏览器结果标记为待验证，不反复改 CSS 字重或添加字体补丁。此处理仅用于已发生的字体异常，不要求每次生成页面都重启应用或检查浏览器。

- 主色只从 `theme.token.colorPrimary` 读取，当前为 `#1890FF`；普通文字字重从 `theme.token.fontWeight` 读取，当前为 `400`；语义加粗从 `theme.token.fontWeightStrong` 读取，Table 表头同步 `theme.components.Table.fontWeightStrong`，当前均为 `500`。
- 页面区块、查询条件、详情与表单网格使用 `layout.elementGap`（16px）；按钮组使用 `layout.buttonGap`（8px）；表格工具栏标题到表格使用 `layout.tableToolbarGap`（12px）。
- 详情 Drawer 内容区四边使用 Ant 默认 `24px` padding；详情分组标题到内容的间距使用 `layout.detailTitleGap`（12px）；Modal 保持现有弹窗标准，表单弹层不使用详情 Drawer 类。
- 查询区与表格区的灰线使用 `layout.queryDividerColor`；弹窗标题和底部操作区的灰线使用 `layout.modalDividerColor`，具体行为由交互规则维护。
- 详情模块之间使用灰色分割线，模块标题下不重复放线；普通文字不使用加粗制造层级，只有明确的标题或语义强调才使用特殊字重。

主题用 ConfigProvider，弹窗和消息用 App 上下文。截图用于框架位置关系，旧组件皮肤统一替换为 Ant。
