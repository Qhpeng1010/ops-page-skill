# 页面契约 v1

page-spec.json 记录需求与验收，不是低代码渲染 schema。代码与契约由助手同步维护，未知字段允许扩展，不能在 JSON 内执行脚本。

| 字段 | 约定 |
| --- | --- |
| schemaVersion | 1 |
| status | draft / ready；ready 仅表示契约已填写，不等于页面验收通过 |
| request | 完整原始自然语言需求 |
| title | 页面名称 |
| family | list / form / detail / dashboard / result / custom 或新任务名称 |
| dataMode | mock / connected / static |
| regions | 非空数组，每项有唯一 id、purpose、components 字符串数组 |
| actions | 每项唯一 id、regionId、trigger、behavior、states；只读静态页可为空 |
| actions[].states | pending / success / error / recovery 四项说明；不适用时写清原因 |
| assumptions | 假设字符串数组 |
| decisions | 关键选择数组，每项 subject / choice / reason |
| extensions | 可选对象，存新能力、字段定义、绑定、页面组合等 |

多页面在 extensions.pages 声明 key、title、入口和返回关系，extensions.bindings 声明传入/传出 ID 或筛选；业务字段定义也可置于 extensions.fields。

涉及新标签页时，在 extensions.pages 记录对应页面的 layout（plain / single-module / multi-module）、showInMenu、来源入口和返回目标；decisions 说明为何用单模块或多模块。默认查询列表、首页保持 plain；用户明确要求的新标签目标页用灰底白色模块。模块 description 仅在用户提供或要求时记录，不自动补写；弹窗禁止标题副描述。

## 示例（契约描述，不代表模板已有审批功能）

```json
{
  "schemaVersion": 1,
  "status": "ready",
  "request": "做一个审批工作台，选择记录后在右侧审批，失败能重试",
  "title": "审批工作台",
  "family": "custom",
  "dataMode": "mock",
  "regions": [
    { "id": "records", "purpose": "选择待处理对象", "components": ["Table"] },
    { "id": "review", "purpose": "查看信息并审批", "components": ["Descriptions", "Form", "Button"] }
  ],
  "actions": [{
    "id": "approve", "regionId": "review", "trigger": "选择对象并提交审批意见",
    "behavior": "更新本地演示记录的状态并刷新左右区域",
    "states": { "pending": "提交按钮 loading", "success": "状态更新并反馈", "error": "保留意见显示错误", "recovery": "修正后重试" }
  }],
  "assumptions": ["使用本地模拟数据，未接真实审批接口"],
  "decisions": [{ "subject": "布局", "choice": "左右工作台", "reason": "保持选择与审批上下文" }],
  "extensions": { "bindings": [{ "from": "records.selectedId", "to": "review.recordId" }] }
}
```

validate-page-spec.mjs 只校验上述核心类型、非空值、唯一 ID、动作的区域引用和 ready 状态，不审核业务真实性、API、组件是否实际使用或 UI 行为。验收证据另写 review.md。

多模块业务 Tabs 可在 extensions.moduleTabs 中记录 pageKey、moduleId / position、scope（page 或 module）、items、defaultActiveKey 和 preserveState；decisions 说明位置和切换范围。默认 tabsMode 为 header，标题与 Tabs 二选一；仅用户明确要求时记录 subtabs 及对应需求依据。顶部 Tabs 与首个内容模块属于同一模块，不登记为空导航卡片。该字段是需求记录，不是自动渲染协议。单模块不默认补充 Tabs。
