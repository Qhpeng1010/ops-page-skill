# 表单页建议

按业务关系组织 Form.Item，存在稳定主题时分组；只有前后依赖、阶段校验或明确步骤需求时使用 Steps。输入多不必拆步骤。

根据字段语义使用 Input、Select、InputNumber、DatePicker、Cascader 等；声明必填、默认值、范围与帮助。关联字段清值/保值有明确规则，异步选项加载可恢复。

提交校验、服务端错误回填、保留输入、重复提交和 dirty 取消需要落地。Modal/Drawer 中的表单通过 onFinish 提交，不绕过 Form 校验直接弹出成功。

Modal 默认点击遮罩关闭，只有用户明确要求时禁止。遮罩关闭复用取消处理和未保存内容策略，不作为提交；示例配置可直接丢弃本次未保存修改。

弹窗禁止在标题下面放副描述、引导段落或示例能力说明，直接展示业务表单。默认继承 1px 通栏分割线，颜色读取 layout.modalDividerColor（rgba(0, 0, 0, 0.08)）：标题 → 16px → 分割线 → 16px → 正文；正文 → 16px → 分割线 → 16px → 按钮。间距读取 layout.modalDividerGap。普通 Modal 无须逐页添加 Divider；方法式提示 / 确认弹窗用 `withModalDividers(options)` 包装选项后传给 `App.useApp().modal`。

普通表单 Modal 必须保留 Ant Modal 的三个语义区域：标题使用 Modal 的 header，字段和校验内容使用 body，取消 / 保存等操作使用 Modal 的 footer。不要把操作按钮手写在表单 body 中，也不要用单一业务容器模拟这三个区域。Modal 内容容器的内边距保持 24px；表单 body 最后一项与底部分割线之间保留 24px 内容留白，footer 按钮继续使用平台的 8px 按钮间距。需要调整默认值时通过 Modal 的公开 `styles` / `classNames` 或局部语义类实现，不依赖 Portal 外部选择器。

Modal / Drawer 内的多字段表单使用 `PlatformOverlayFormGrid`（默认两列），字段上下和列间均为 `layout.elementGap`（16px）；需要占满一行的字段使用 `platform-overlay-form-wide`。单列表单仍保持字段之间 16px 的纵向间距，所有字段、label 和按钮文字使用常规体 400。

用户要求新标签页新增 / 编辑或步骤表单时采用 [模块页规则](module-page.md)：单任务通常一个白色模块撑满内容区，四周 12px 灰边；多个独立信息块才拆为随内容增高的多个模块。多模块表单默认使用三列纵向字段网格，列间和行间距为 16px。新增 / 编辑默认使用全局吸底操作栏，详情展示默认不加，用户明确要求时可自定义。模块标题默认无副描述，明确需要时可增加。
