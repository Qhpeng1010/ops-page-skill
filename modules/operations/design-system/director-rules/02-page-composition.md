# 页面组合规则

先识别主要任务，再决定结构；规则等级见视觉规则。

这是页面载体和区域组合的唯一维护入口。组件 API 细节见 `references/antd-components.md`，具体页面族细节见 `page-patterns/`；`CUSTOMIZE.md` 只做定位索引。

| 任务 | 页面族 | 可组合区域 |
| --- | --- | --- |
| 查找、比较、处理记录 | list | 筛选、指标、表格、批量操作、详情抽屉 |
| 创建、修改、配置对象 | form | 分组、关联数据、条件字段、复核、步骤 |
| 理解某个对象 | detail | 摘要、Descriptions、Tabs、关联表、Timeline |
| 查看趋势与异常 | dashboard | 过滤器、Statistic、分析图、异常记录、下钻 |
| 解释结果与后续路径 | result | Result、进度、摘要、返回、重试 |
| 编排、对比、组合工作台 | custom | 根据任务自由组合，无强制骨架 |

- **CMP-01 REQUIRED**：明确载体和布局优先。“支持编辑”不自动意味着独立页，“流程”不自动意味着 Steps。
- **CMP-02 DEFAULT**：短上下文任务用 Modal，丰富的上下文详情/编辑用 Drawer；独立地址、复杂关联或长任务用页面。字段数不设死阈值。
- **CMP-03 DEFAULT**：列对齐、排序、分页与批量处理用 Table；图文实体摘要可用 Card；选择方案仍由 Radio/Checkbox 提供语义。
- **CMP-04 REQUIRED**：新能力未注册仍开放实现；专业图表和画布先检查依赖，说明 Ant 原语不足的原因，外围控件继续用 Ant。
- **CMP-05 DEFAULT**：只展示实际实现或宿主已有的菜单，不照搬截图全部商户菜单制造完整性。
- **CMP-06 REQUIRED**：菜单、页签、面包屑、内容引用同一页面注册信息；关闭当前页签回退相邻页或默认页，不能留下空工作区。
- **CMP-07 DEFAULT**：保留筛选与分页上下文，多页面传递对象 ID 与来源；需刷新恢复时使用 URL 或既有状态方案。
- **CMP-08 DEFAULT**：用户明确要求“新标签页打开 / 新标签页新增”时，目标业务页按 [模块页规则](../page-patterns/module-page.md) 使用灰底白色模块；默认查询列表和首页仍为白底，不能把所有菜单页因位于 Tabs 中而一律改灰。一个任务模块（表单或步骤等）撑满可用内容区，多个独立信息模块按内容自然增高。是否拆模块依据业务关系，不按字段数量机械拆分。

- **CMP-09 DEFAULT**：短任务优先 Modal，带上下文的详情或编辑优先 Drawer，复杂关联、长任务或需要独立地址时使用新标签页；字段数量不能单独决定载体。
- **CMP-10 DEFAULT**：多模块页使用白色 Ant Card 模块。单模块撑满灰色内容区；多模块按内容自然增高，模块间距为 `layout.newTabModuleGap`（12px），外侧灰边为 `layout.newTabPadding`（12px）。
- **CMP-11 DEFAULT**：多模块详情默认使用 `PlatformModuleDescriptions` 三列、行间距 12px；相邻详情模块之间使用灰色分割线。含 Table 的模块传 `hasTable`，不默认增加模块标题下分割线、独立表格标题或三项表格设置。
- **CMP-12 DEFAULT**：多模块业务 Tabs 使用 Ant `Tabs`，未指定位置时与第一个模块融合。同一模块默认在标题和 Tabs 中二选一，只有明确要求标题下子 Tabs 才同时保留。
- **CMP-13 DEFAULT**：Modal / Drawer 表单使用 `PlatformOverlayFormGrid`，默认两列，字段上下和列间距为 16px；长字段使用 `platform-overlay-form-wide` 占满整行。

单页新选择写入 decisions；稳定复用后才变为平台模式。
