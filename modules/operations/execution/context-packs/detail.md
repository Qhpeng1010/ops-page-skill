# 运营后台 Detail Context

命中独立详情页或用户明确要求完整详情展示时读取。按需使用 `modules/operations/design-system/page-patterns/detail.md`；列表内查看详情优先使用 Ant `Drawer`，详情信息按业务分组，底部操作固定在右侧并保留关闭路径。详情 Drawer 统一加 `platform-detail-overlay`，内容区四边使用 Ant 默认 `24px` body padding，分组标题到内容使用 `layout.detailTitleGap`（默认 12px）；Modal 沿用现有弹窗标准，分组之间仍保留 16px → 灰线 → 16px。
