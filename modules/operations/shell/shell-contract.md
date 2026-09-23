# Shell 业务接入契约

独立项目由脚手架复制本目录到 `src/platform/`。普通生成只读取本契约，导入这些公共接口；布局维护、截图和样式实现见 [Shell 维护参考](shell-maintenance.md)，仅修改公共框架时读取。

## 页面注册

```tsx
import type { PlatformPage } from './platform/PlatformShell';
export const pages: PlatformPage[] = [{
  key: 'business-page', title: '业务页面', group: '业务分组',
  projectKeys: ['platform-settings'],
  render: () => <BusinessPage />,
}];
```

可选 `layout`：`plain` 为白底列表；明确要求的新标签目标页用 `single-module` / `multi-module`。`showInMenu: false` 隐藏业务目标页菜单，仍可用 `render({ openPage })` 的 `openPage(key)` 打开。`canClose(): boolean | Promise<boolean>` 可阻止有未保存内容的页签关闭/跨项目切换。项目在复制后的 `platform.config.json.projects` 定义，仅保留实际生成的项目与导航。

路由为 `#项目key/页面key`，刷新恢复页签 ID；sessionStorage 不保存业务数据。同项目页签保持挂载，跨项目卸载业务页。需要刷新恢复业务输入时由页面明确实现。列表打开隐藏的新标签详情时，当前对象 ID 必须通过路由参数、可恢复的页面状态或页面约定的 sessionStorage 绑定保存；不能只依赖模块级内存变量，否则刷新详情页会退化为空状态。详情页在绑定缺失时才显示空状态。

## 查询与列表

- `PlatformQueryForm`：继承 Ant Form props，`columns={3 | 4}`，可选 `collapsible`、`defaultExpanded`；children 为 Form.Item，`actions` 放查询/重置。查询按钮用 `htmlType="submit"`，操作区自动靠最后一列右侧；收起只显示首行，Form 保留字段值。
- `PlatformTable<T>`：继承 Ant Table props，可传 `columnAlign="left" | "center" | "right"`；单列 `align` 优先。操作列用 `key: 'action'` 或标题“操作”，横向溢出时自动固定右侧，仍应按字段宽度传入 `scroll.x`。行操作按[列表页规则](../design-system/page-patterns/list.md)统计当前行可见项，3 项及以上默认使用 Ant Dropdown；用户明确要求展开时每行最多 3 个文字按钮并换行，规格模式设置 `list.table.actionDisplay: "expanded"`。文字按钮组之间固定使用 `layout.buttonGap`（默认 8px），React 操作列不要显式使用 `Space size={0}`。业务维护 rows、查询、loading、error、分页和列显隐状态。
- `PlatformTableToolbar`：`title`、`primaryAction`、`secondaryActions`；`onRefresh`、`refreshLoading`；`size` / `onSizeChange`（small/middle/large）；`columnOptions: { key, label }[]`、`visibleColumnKeys` / `onVisibleColumnKeysChange`。`showTitle` / `showRefresh` / `showDensity` / `showColumnSettings` 默认 true。标题继承平台字体栈，使用 16px 和 `theme.token.fontWeightStrong`（默认 500，中黑体）；业务按钮用 Ant Button，主操作 primary，辅助 default；设置工具使用内置图标。
- `PlatformTableValue`：`kind="status"`、`label`、Ant Badge 的 `status` 默认呈现状态点；`kind="category"` 默认无色 Tag。`display="status" | "tag" | "text"` 可切换，显式 `color` 才加彩色 Tag。

查询与列表放 `.page-stack`，中间放 Ant Divider（margin 0、颜色读取 layout.queryDividerColor）。表格区域使用 `.table-region`，行内操作 Button 可用 `.table-action-link`。普通列表白底，不包无意义 Card。

## 弹层与详情

- 新增/编辑用 Ant Modal，`PlatformOverlayFormGrid` 包裹纵向 Form.Item，默认两列、可用 `columns={1}`；占满行用 `platform-overlay-form-wide`。字段间距由网格统一提供。
- 普通 Modal 自动继承标题、底部分割线；`App.useApp().modal.confirm/info` 等方法弹窗，以及列表行操作二次确认，都将参数先交给 `withModalDividers(options)`，统一显示 warning 图标、标题/正文/底部区域分割线和右下角操作按钮。危险确认按钮传 `okButtonProps={{ danger: true }}`。无副标题。遮罩关闭与取消行为一致，保存期间防重复提交。
- Ant Drawer 使用 `closable={{ placement: 'end' }}`；footer 用 `.platform-drawer-footer` 右对齐按钮，只读详情保留“关闭”。
- 详情 Drawer 加 `className="platform-detail-overlay"`，内容区四边使用 Ant 默认 `24px` body padding；详情分组标题到内容的间距为 `layout.detailTitleGap`（默认 12px）。Modal 保持现有标题分割线、正文留白和底部操作区标准。多组详情以 `.page-stack` 包裹相邻 `.platform-detail-section`，自动形成 16px → 灰线 → 16px。不另叠 margin 或标题下分割线；平台 Provider 已将变量注入弹层。
- `PlatformModuleDescriptions` 继承 Ant Descriptions props，默认三列、行间 12px，支持 `column`、`rowGap`。详情内 Table 默认不加独立工具栏；格式遵守同一表头、状态、单位规则。

## 多模块页面（仅命中时）

先读 [module-page.md](../design-system/page-patterns/module-page.md)。`PlatformModule` 为白色 Card，支持 `title`、`extra`、`detail`、`hasTable`；详情传 detail，含表格传 hasTable。需要业务 Tabs 时传 Ant `TabsProps` 给 `tabs`，默认取代模块标题；仅明确要求标题下子 Tabs 时用 `tabsMode="subtabs"`。

`PlatformModuleFormGrid` 为三列 Form 网格，占满行用 `platform-module-form-wide`。新增/编辑的 `PlatformPageFooter` 提供吸底操作，传 `primaryAction`、`secondaryActions`，详情默认无 footer。

## 主题与框架边界

`PlatformProvider` 包含 ConfigProvider + App、中文 locale、主题和弹层间距；`main.tsx` 已接入。字体沿用系统栈，正文 400、所有语义加粗和表头 500（中黑体）。各数值读复制后的平台配置，页面不重写导航、Logo、项目切换、页签和顶栏工具，不反向导入技能绝对路径。

所有静态 Logo 与构建资源随 Change 输出；开发时的 node_modules 可以是缓存链接，`preview.html` 运行不依赖该链接。
