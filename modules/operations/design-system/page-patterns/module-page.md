# 新标签页的模块布局

用户明确要求从列表查看、创建、编辑等入口打开新标签页时读取。布局参考 [用户示例](../../../../assets/reference-modules.png)，参考视觉关系，不据截图虚构业务能力。

- 默认查询列表、首页、普通菜单页使用 `layout: 'plain'`（或省略），保持白底。页面出现在工作区 Tabs 中本身不触发灰底。
- 明确要求的新标签页：灰底 `layout.newTabBackground`（默认 #EAEDF0），四周 `layout.newTabPadding`（默认 12px）。信息内容放在白色 Ant Card 模块内，不再套白色整页外壳覆盖灰边。
- 一个表单、步骤任务或单块内容：注册 `layout: 'single-module'`，直接返回一个 `PlatformModule`。白色模块宽度撑满内侧区域，最小高度填满扣除顶栏、页签栏和四周灰边后的可用空间；内容较长时自然增高并滚动，不截断。
- 多个独立信息块：注册 `layout: 'multi-module'`，直接返回多个 `PlatformModule`（可用 Fragment）。模块间距取 `layout.newTabModuleGap`（默认 12px），高度跟随各自内容，不固定高度、不等高、不平均分配屏高；支持仅标题的模块。
- 模块标题使用主题色竖条。默认只显示标题，不自动编造副描述；用户提供或要求时才传入可选 `description`，显示在标题右侧，窄屏可换行。弹窗禁止副描述的规则仍单独适用。
- 多模块中出现表单信息时，Form 使用纵向 `layout="vertical"`，默认通过 `PlatformModuleFormGrid` 按 3 列排列，列间和行间距取 `layout.elementGap`（默认 16px）；字段较长时可显式占满整行，窄屏退化为单列。
- 新增 / 编辑类多模块表单默认在页面底部启用 `PlatformPageFooter` 全局吸底操作栏；详情展示页默认不启用。操作栏始终右对齐，辅助按钮在左、主按钮在最右，按钮间距取 `layout.buttonGap`（默认 8px）。用户明确要求时可在详情或其他页面开启、关闭或自定义 `summary` 与操作。

多模块需要分类切换时支持业务 Tabs，具体位置及切换范围见下方“多模块业务 Tabs”。单模块不增加默认 Tabs 规则。

`PlatformModule` 来自 `src/platform/PlatformModule.tsx`，使用 Ant Card、Typography 和平台 Token；业务表单、Steps、Descriptions、Table 等自由组合在其中。不要把截图里的具体规则组或空数据硬编码为每个新需求的内容。

```tsx
{
  key: 'create-record', title: '新增记录', group: '业务管理',
  showInMenu: false, layout: 'single-module',
  render: ({ openPage }) => <PlatformModule title="基本信息">
    <RecordForm onCancel={() => openPage('records')} />
  </PlatformModule>,
}
```

列表动作通过 `render` 获得的 `openPage('create-record')` 打开工作区页签。独立业务页可以 `showInMenu: false`，但仍注册到同一 Shell，保留页签关闭、返回、URL 恢复及项目归属。动态记录 ID 与 dirty 关闭策略按业务补充，本布局不代替这些行为。

验收：白底来源页不被改色；新页签四边灰边及模块间距均为 12px；单模块短内容填满、长内容可滚动；多模块按内容适配；切页 / 关闭 / 刷新恢复正常；标题不自动增加副描述。

表单页验收：字段默认三列、纵向标签布局、列间和行间均为 16px；新增 / 编辑页默认有全局吸底操作栏且操作顺序为辅助在左、主按钮在最右；详情页默认没有全局吸底栏。

## 多模块中的详情与表格

参考[详情与关联表格](../../../../assets/reference-module-details-table.png)，规则限定于多模块页面。

- 详情使用 Ant `Descriptions`，默认三列，行与行之间留 12px。复用 `PlatformModule.tsx` 导出的 `PlatformModuleDescriptions`，默认 `column={3}`、`size="middle"`；间距来自 `layout.moduleDetailRowGap`。按用户要求可覆盖 `column` 或 `rowGap`，内容换行时行高自然增长。上下间距不叠加为 24px，最后一行不留额外行间距。
- 模块标题保留；Table 默认不传 `title`，不添加表格独立标题和刷新、密度、列设置工具栏。用户明确要求时只添加对应项：若使用 `PlatformTableToolbar`，将其余 `show*` 设为 false，开启项需接入交互。这条覆盖普通查询列表的工具栏默认规则。
- 只要模块内含 Table（包括与详情混合或放在业务 Tabs 内），该模块设置 `hasTable`，同时去掉模块标题下方分割线和标题到表格之间的 16px 顶部留白。保留表格列标题、表头和行分隔线，也不隐藏 Tabs 导航线。纯详情模块不在标题下单独放分割线，详情模块之间由相邻模块分隔线表达。
- 详情模块之间使用灰色分割线，模块标题下不重复放线。详情模块传 `detail` 给 `PlatformModule`；Drawer 或同一内容容器内的自定义详情分组使用 `.page-stack` 包裹 `.platform-detail-section`，间隔为“上块内容 → 16px → 1px 灰线 → 16px → 下块标题”，间距取 `layout.elementGap`。父级 gap 负责线前间距，后一分组 padding-top 负责线后间距，不再叠加 margin；首块前、末块后不补分隔线或额外分组间距。公共 Provider 通过 Drawer / Modal 的公开语义样式把变量传入弹层，不能依赖 Portal 继承 Shell 的 CSS 变量。独立新标签页 Card 之间的灰色外间距仍按 `layout.newTabModuleGap`；表格模块内部仍按 `hasTable` 规则处理。

```tsx
import { PlatformModule, PlatformModuleDescriptions } from './platform/PlatformModule';

<PlatformModule title="基本信息" detail>
  <PlatformModuleDescriptions items={detailItems} />
</PlatformModule>
<PlatformModule title="关联人信息" hasTable>
  <Table size="middle" rowKey="id" columns={columns} dataSource={records} />
</PlatformModule>
```

验收：详情每行默认三项、行间距 12px；相邻详情模块之间有灰色分割线，模块标题下不重复放线；Drawer / Modal 或同一内容容器内的详情分组在线前、线后各有 16px 间距，使用平台配置且不重复叠加；默认表格无独立标题及三项设置入口；含表格的模块无标题分割线，标题到表格顶部无额外 16px 留白；普通查询列表仍有默认工具栏。

## 多模块业务 Tabs

参考 [用户 Tabs 示例](../../../../assets/reference-module-tabs.png)：白色背景、横向文字标签、常规字重，选中文字和底部下划线使用平台主题色。使用 Ant `Tabs type="line"`，保留焦点、键盘操作及窄屏溢出处理；不套工作区可关闭卡片页签的样式。

这是按需求启用的能力，不要求所有多模块页面都有 Tabs。要求分类切换且未指定位置时，与第一个内容模块融合：Tabs、分隔线和首块正文放在同一白色 Card 内，不能把 Tabs 单独拆成一张导航卡片。参考 [融合布局](../../../../assets/reference-module-tabs-integrated.png)。用户指定某模块时将 tabs 传入该模块，位置不限于第一个。单模块通常不添加 Tabs，不建立默认添加规则，也不禁止用户明确要求的分类交互。

- `PlatformModule` 接收可选 `tabs: TabsProps`，标签、顺序、默认项、禁用项与内容都由业务决定。同一模块的标题与 Tabs 默认二选一：`tabsMode="header"`（默认）且有 tabs 时不显示 title / description，不产生重复标题栏或占位；extra 自动进入 Tabs 操作区。只有用户明确要求“标题下面加子 Tabs”才设置 `tabsMode="subtabs"`，这不是常规默认布局。
- 页面范围：受控 `activeKey/onChange` 选择下方模块组合，共享筛选可放在首个带 Tabs 的模块正文内；不同分组仍遵循 12px 灰边和模块间距、自然内容高度。
- 模块范围：将内容放入 `tabs.items[].children`，仅替换该模块正文，其他模块不联动，除非业务明确要求。
- 带 Tabs 时，模块正文容器的顶部内边距为 0，使用 Ant Tabs 自身的标签留白，避免叠加 16px。左右、底部及 Tabs 分隔线到正文仍取 layout.elementGap（默认 16px）；不带 Tabs 的模块保持原有内边距。标题下子 Tabs 同样取消正文容器顶部的额外内边距，标题自身间距不受影响。
- 默认保留已访问的页签内容（destroyOnHidden=false）。页面范围的条件渲染会卸载被切走的模块，需要保留的筛选、表单和局部页签状态应提升到父组件或使用业务状态管理；需要刷新恢复时按需求接入 URL，组件自身不承诺持久化。
- 在 page-spec 中记录模块位置、切换范围、标签和默认项、共享状态。涉及异步数据时补齐加载、失败和重试；纯本地切换不伪造请求状态。

```tsx
// 放到用户指定的任意模块，仅切换该模块正文。
<PlatformModule tabs={{
  defaultActiveKey: 'overview',
  items: [
    { key: 'overview', label: '客户总体情况', children: <CustomerOverview /> },
    { key: 'transactions', label: '客户交易情况', children: <CustomerTransactions /> },
  ],
}} />

// 顶部切换一组模块：view 由页面 useState 管理。
<PlatformModule tabs={{ activeKey: view, onChange: setView, items: viewItems }}>
  <CustomerSummary />
</PlatformModule>
{view === 'overview' ? <OverviewModules /> : <TransactionModules />}

// 仅当用户明确要求标题下子 Tabs 时使用。
<PlatformModule title="结算风险规则组" tabsMode="subtabs" tabs={{ items: ruleItems }} />
```

模板的 MultiModulePreview 展示基本信息和关联人表格，并演示首个模块内的整组切换和规则模块内的局部切换；前者与商户选择融合，后者只展示 Tabs，不重复显示模块标题。标签文字及具体模块仅为示例，不固定为所有业务的内容。商户筛选和局部选中项保留在父级内存中；交易和规则均为空状态，未连接真实接口。

验收：同一模块默认只有标题或 Tabs，标题下子 Tabs 仅在明确要求时出现；首个模块的 Tabs 与正文共用同一白色 Card；点击和键盘均能切换对应内容；模块内切换不影响其他模块；共享筛选及约定状态保留；顶层工作区页签、路由不被业务 Tabs 改写；白色模块四周和模块间距仍为 12px，窄屏无整页横向溢出。
