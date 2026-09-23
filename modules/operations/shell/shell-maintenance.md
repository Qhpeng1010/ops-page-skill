# Shell 维护参考

仅在修改公共框架、复核样式实现或用户明确要求时读取。普通业务生成使用 [Shell 契约](shell-contract.md)。

## 截图到实现

- 左栏：左对齐 Logo + Ant 白色竖向 Divider + Ant Button 项目切换入口（朝右图标）+ 从侧栏右缘滑出的 Ant Drawer / Menu 面板，下方 Ant Menu 层级菜单；窄屏改 Ant Drawer。
- 顶栏：整体高 50px（`shell.headerHeight`），左侧品牌区同高，页面滚动时固定在 top=0；折叠按钮 + Ant Breadcrumb + 默认可用的搜索、全屏和个人中心工具区 + 可选扩展工具槽。搜索、全屏和个人中心都必须有真实前端行为，不放无行为的装饰按钮。
- 页签栏：Ant Tabs，整体高 36px（`shell.tabsHeight`，含底边框），使用公开的 `styles.header` / `styles.item` 设置，滚动时固定在顶栏下方（top=headerHeight），保持不透明背景；可切换和关闭，关闭最后一页时保留默认页。
- 内容区：查询列表、首页默认全宽白底（暗色时使用派生色）；明确要求的新标签页按 [模块布局](../design-system/page-patterns/module-page.md) 使用灰底和白色模块，不重复搭建框架。
- Drawer 标题栏统一左右分布：标题在左侧，关闭按钮在最右侧；使用 Ant Drawer 的 `closable={{ placement: 'end' }}` 公共 API，详情 Drawer、移动导航 Drawer 和项目切换 Drawer 均遵循此规则。footer 内按钮始终右对齐，多个操作按辅助在左、主按钮在最右排列；只读详情 Drawer 通过 `footer` 提供右侧辅助“关闭”按钮，复用 `onClose`，按钮组间距取 `layout.buttonGap`。

`PlatformShell` 接收 `pages` 和可选 `tools`。每个页面含稳定 `key`、`title`、`group`、可选 `projectKeys`、可选 `icon` 元数据、`render({ openPage })`、可选 `canClose()`。`layout` 可选 plain（默认白底）、single-module 或 multi-module；后两者使用灰底、四周 12px 和 PlatformModule。`showInMenu: false` 的业务目标页仍进入路由 / 页签，可通过 openPage(key) 打开，但不添加侧栏菜单。导航中的二级页面菜单不显示图标。菜单、页签和面包屑由同一注册信息生成。

`platform.config.json.projects` 配置项目的唯一 `key` 和展示 `name`；页面的 `projectKeys` 限定所属项目，省略则供全部项目使用。仅展示有注册页面的项目，首个可用项目为默认入口。切换项目时菜单与工作区同步切换，各项目分别记忆打开页签及当前页；项目名省略显示时，Tooltip 和项目面板提供完整名称。收起侧栏时项目入口位于顶栏，窄屏位于顶栏及导航抽屉。

Logo 右侧的白色竖向分割线高 16px，由 `brand.dividerHeight` 控制。项目按钮文字使用常规字重 400；品牌区的项目按钮文字和图标在默认、悬停和按下状态始终为白色；白色顶栏中的入口沿用正常文字色。

项目切换面板使用 Ant Drawer 的左侧入场动画，桌面根容器从侧栏右缘开始，覆盖内容区，展开 / 收起侧栏时分别跟随 205px / 64px 的起点。默认面板宽 126px、高度 50dvh（动态可视窗口的 50%），顶部对齐，标题与列表字号均为 12px；深色列表超出时内部滚动，当前项目以下划线标记。通过公开的 `styles.wrapper` 限定面板高度，保留全屏透明外部点击遮罩。窄屏从屏幕左侧滑出，先关闭移动导航抽屉。按钮、Esc 和透明遮罩关闭遵循 Ant Drawer；成功切换后关闭面板，`canClose()` 拒绝时保留当前项目及面板。配置入口为 `shell.projectPanelWidth` / `projectPanelHeightPercent`（大于 0 且不超过 100）/ `projectPanelFontSize` / `projectPanelBackground`。

`canClose()` 返回 boolean 或 Promise<boolean>，用于 dirty 表单关闭确认。同一项目的侧栏与页签切换保留已打开页的挂载状态；跨项目切换（含浏览器前进后退）先检查原项目所有已打开页的 `canClose()`，任一拒绝则保留当前项目。通过后卸载原项目页面。跨项目返回及刷新只恢复页签 ID，不承诺恢复内存里的业务输入。需要恢复业务输入的页面自行补草稿等策略，需要防刷新丢失时补 beforeunload。

`platform.config.json` 是共享主题与布局输入，`PlatformProvider` 提供 ConfigProvider + App。`shell.css` 仅包含框架 class，不覆盖 Ant 内部类。

模块页的可用最小高度按动态视口减去顶栏和页签栏计算；single-module 的一个直接子 PlatformModule 填满四周灰边以内的空间，长内容继续自然增高；multi-module 的模块不拉伸，随内容自适应。外侧灰边取 layout.newTabPadding（默认 12px），模块间距取 layout.newTabModuleGap（默认 12px），背景取 layout.newTabBackground。无页签栏时不扣除页签高度；隐藏页仍遵循 hidden。组件标题使用主题色竖条和可选 description，副描述不自动生成。

查询列表使用 [PlatformQueryForm](./PlatformQueryForm.tsx)（或等价的 Ant Form + CSS Grid）：默认三列，仅允许三列或四列；可选 `collapsible` 在条件超过当前列数时提供带方向图标的展开 / 收起按钮。`actions` 容器始终占据最后一列并右对齐，条件不足一整行时与最后一项条件共行，条件填满时自动落到下一行最右侧。窄屏退化为单列。普通查询列表区域的工具栏由业务页面按需组合 `PlatformTableToolbar`；默认显示标题、刷新、密度和列设置，标题到表格默认 12px，右侧三个设置按钮不追加 8px gap，业务操作组与设置项之间保留 8px。业务主操作通过 `primaryAction` 使用 Ant `Button type="primary"`，辅助操作通过 `secondaryActions` 使用普通 Ant Button，不使用 link / text 按钮；从左到右为辅助操作、主操作、刷新、密度、列设置，业务按钮间距为 `layout.buttonGap`（8px）。隐藏标题或设置项时业务操作仍右对齐。`extra` 兼容自定义内容，并排在主操作之前。状态 / 种类单元格复用 [PlatformTableValue](./PlatformTableValue.tsx) 的默认 Badge / Tag 语义，种类型默认无颜色，明确需要彩色标识时传色值，并可按字段切换为文字。

表格使用 [PlatformTable](./PlatformTable.tsx) 时默认列左对齐，可传 `columnAlign="center"` 或 `"right"` 调整未单独声明的列；单列 Ant `align` 优先。不要用全局 CSS 覆盖 `th` / `td` 的对齐规则。

表格发生横向溢出时，操作列默认固定在右侧：使用 `fixed: 'right'`，并配置 `scroll.x`；`PlatformTable` 会识别标题为“操作”或 action/actions 键的列并自动补齐这两个设置，显式的 `fixed` 和 `scroll` 优先级更高。

多模块页内的详情复用同文件导出的 `PlatformModuleDescriptions`，默认三列，行间距读取 `layout.moduleDetailRowGap`（12px）；可通过 `column`、`rowGap` 按要求调整。它仅通过局部 ConfigProvider 设置 Descriptions Token，不影响详情抽屉。详情模块传 `detail`，相邻详情模块由公共 Shell 使用灰色分割线分隔，模块标题下不重复放线。含 Table 的模块显式设置 `hasTable`（包括表格与详情混合的模块），自动移除标题下分割线及标题到表格顶部的 16px 留白；模块内表格不传 Table.title、不默认插入 PlatformTableToolbar；用户要求某项工具时，将其余 show* 参数设为 false，仅启用指定项并绑定真实交互。Tabs 自身导航线、表头及表格行分隔线保留。

多模块表单使用同文件导出的 `PlatformModuleFormGrid`，默认 `columns={3}`，父级 Ant `Form` 使用 `layout="vertical"`；列间、行间读取 `layout.elementGap`（16px），可将单个字段设置为 `platform-module-form-wide` 占满整行，窄屏自动单列。新增 / 编辑页通过 `PlatformPageFooter` 默认启用全局吸底操作栏；详情页默认不启用。操作栏使用 Ant `Space`，始终右对齐，辅助操作在左、主操作在最右，间距读取 `layout.buttonGap`（8px），允许页面显式传 `visible`、`summary` 或自定义 actions。

Modal / Drawer 表单使用 `PlatformOverlayFormGrid`，默认两列，字段行间和列间均为 `layout.elementGap`（16px）；需要占满整行的字段使用 `platform-overlay-form-wide`。单列表单也保持字段间 16px 纵向间距，查询、表单、按钮、label 和 Table 正文默认常规体 400；所有语义加粗由 `theme.token.fontWeightStrong` 设为 500（中黑体），Table 表头同步 `theme.components.Table.fontWeightStrong`，主列表和详情内表格一致。字体统一由 `PlatformProvider` 的主题继承标准系统字体栈，含挂载于 Shell 外的弹层；Shell 不默认注册本地字体别名。

详情抽屉或同一内容容器内的分组，使用 `.page-stack` 包裹相邻 `.platform-detail-section`：父级 gap 在线前留 16px，后组 padding-top 在线后留 16px，均来自 `layout.elementGap`。详情 Drawer 加 `platform-detail-overlay`，其内容区四边沿用 Ant 默认 `24px` body padding，分组标题到内容使用 `layout.detailTitleGap`（默认 12px）；Modal 保持现有标题分割线、正文留白和底部操作区标准。Drawer 通过 `PlatformProvider` 的 `drawer.styles.root` 接收 `--ops-element-gap`、`--ops-detail-divider` 和 `--ops-detail-title-gap`；Modal 继续通过 `ModalDividerDefaults` 使用原有间距，不使用详情 Drawer 覆盖。不要通过修改挂载位置或全局覆盖 Ant 样式解决。独立新标签页的 Card 外间距仍使用 `layout.newTabModuleGap`。

平台主色默认 #1890FF，由 `theme.token.colorPrimary` 统一维护。深色导航二级菜单选中文字默认从该值取得，可由显式 `Menu.darkItemSelectedColor` 覆盖；链接和信息提示分别以主色作为 `colorLink` / `colorInfo` 的默认值，支持显式覆盖。主按钮、分页和页签按主题派生，成功、警告和错误保留独立语义色。一、二级菜单、项目列表与面包屑统一为常规字重 400，当前项、选中项和展开状态均不加粗；通过 Menu / Breadcrumb 的公开语义 `styles` 作用于文字。

一、二级菜单行高均为 50px（`Menu.itemHeight`），一级菜单使用 Ant 面性（Filled）图标，二级菜单纯文字、同一缩进线左对齐。导航采用满宽直角菜单行，`Menu.itemBorderRadius`、`subMenuItemBorderRadius`、`itemMarginInline`、`itemMarginBlock` 均为 0。菜单和侧栏默认底色 #304156；展开的二级菜单和收起后的子菜单浮层底色 #1f2d3d；二级菜单（含选中项）悬停底色 #001529。颜色由配置的 Menu Token 维护，选中项悬停通过公开的 `classNames` / 菜单项 `className` 补充，避免依赖 Ant 内部选择器。

导航选中态只高亮二级菜单文字；一级分组的文字、面性图标和箭头均保持 `Menu.darkItemColor`（默认 #bbc7d4），展开、收起及下级选中时一致。当前安装的 Ant Menu / rc-menu 中，`styles.subMenu.itemTitle` 未作用于该父级标题，因此通过公开的菜单项 `className`（platform-navigation-group）配合 `[role="menuitem"][aria-expanded]` 局部设置，颜色来自配置变量；不依赖 Ant 内部类名，不改动二级菜单选中色。

`PlatformNavigation` 使用受控 `openKeys` 同时最多展开一个分组，展开新分组自动关闭旧分组，再次点击可全部收起。进入页面、切换页签或项目时只展开当前页面的分组；收起侧栏时关闭内嵌展开项，子菜单浮层仍互斥；恢复侧栏时定位当前页。桌面与窄屏抽屉复用同一组件。

页签是独立矩形，四角圆角为 `shell.tabsBorderRadius`（默认 4px），默认自身高 28px、栏高 36px。选中时主色底、白字与圆点，未选中为白底描边及 `colorTextSecondary`。文字 12px、字重 400，选中圆点 6px，页签间距 4px，分别由 `shell.tabsFontSize`、`tabsDotSize`、`tabsGap` 控制；关闭图标未选中时为 `colorTextTertiary`，选中时与文字同为白色，左侧外边距为 0；大小由字号 × `tabsCloseIconScale` 得出（默认 12 × 0.8 = 9.6px）。通过公开的 Tabs 语义 classNames / styles 及 `[role="tab"][aria-selected]` 表达状态，保留 Ant 的键盘导航、关闭、溢出菜单与焦点行为。

左栏展开宽度为 205px（`shell.sidebarWidth`），收起宽度仍由 `shell.collapsedWidth` 控制。展开 / 收起分别使用本目录 [展开 Logo](./易宝支付:展开.svg) 与 [收起 Logo](./易宝支付:收起.svg)，两种状态都使用 `brand.logoHeight`（默认 22px）与自动宽度，保持原始比例并左对齐。脚手架将两份资源与 Shell 一起复制。`brand.logoUrl` / `brand.collapsedLogoUrl` 可覆盖对应资源；留空表示使用内置 SVG。

运行时文件名分别为 `logo-expanded.svg` 和 `logo-collapsed.svg`，由脚手架从原始 SVG 派生复制，避免冒号出现在资源请求路径中。直接集成 Shell 到既有项目时，也需要复制这两份资源并使用上述运行时文件名。

本地预览以 `#项目key/页面key` 定位项目与页签，也兼容旧的 `#页面key` 链接（选择首个包含该页的项目）。sessionStorage 只存项目和页签 ID，项目记录相互隔离；项目菜单不是鉴权边界。接入有路由的项目时应替换为项目路由和状态方案，保留一致性与关闭回退契约，不再创建第二个 URL 管理器。

Shell 只遵循本文件、`shell-contract.md` 和平台配置中的区域关系、深色侧栏、顶栏、页签与模块规则；不从历史页面内容推断商户菜单数量、按钮颜色、头像或悬浮工具等能力。

`PlatformModule` 可传 `tabs: TabsProps` 组合 Ant 线型 Tabs，默认 `tabsMode="header"`：有有效 tabs 时隐藏模块 title / description，标题与 Tabs 二选一；extra 进入 Tabs 操作区，不留下空标题栏。只有用户明确要求标题下加子 Tabs 时设置 `tabsMode="subtabs"`，同时显示标题与 Tabs。该能力供多模块页面按需使用，默认与第一个内容模块融合，标签和正文位于同一 Card 内，用户也可指定其他模块。页面范围的 activeKey/onChange 由页面管理以切换模块组；模块范围通过 items.children 切换局部内容。业务 Tabs 不修改 Shell 页签与路由，默认保留已访问面板；条件渲染的状态保留由页面负责。单模块不默认添加。

带 Tabs 的模块正文容器取消顶部 16px 内边距（paddingTop: 0），由 Ant Tabs 自身提供标签留白；左右、底部和 Tabs 到正文间距仍为 layout.elementGap（默认 16px）。普通无 Tabs 模块保持原内边距，外侧灰边与模块间距仍为 12px。


顶栏默认工具区由 Shell 提供：Ant 搜索按钮打开页面搜索弹窗，过滤当前注册且可见的页面并支持跨项目跳转；全屏按钮调用公开的浏览器 Fullscreen API，监听 fullscreenchange 更新图标，不支持时通过 App 消息反馈；个人中心按钮展示 `shell.userName`，使用 Ant Dropdown 菜单进入个人资料或偏好设置弹窗。`tools` 属性仅追加业务自定义工具，不替换默认三项。

## 规格模式共享包

`runtime/platform-entry.ts` 直接导出本目录公共组件；`scripts/build-spec-runtime.mjs` 只在维护框架或依赖时运行，将 React 模板锁定的依赖和本目录源码编译成经典脚本及 CSS。只对配置输入与 Logo 文件加载作离线适配：配置由 Change 注入，原始 SVG 内嵌为 data URI。不会复制或改写导航、顶栏、页签、查询布局和交互实现。

先使用已准备的本地 React 项目或缓存编译，再执行两份生成回归测试及 check-skill。源码、Logo、锁文件或维护入口变更会让旧共享包失效；普通页面构建只做指纹校验和复制，不隐式安装依赖或编译。配置数值变更无需重编译，在下次构建预览时注入。
