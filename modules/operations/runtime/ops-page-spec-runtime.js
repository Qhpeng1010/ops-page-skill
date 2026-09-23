(function () {
  'use strict';

  const platform = window.OpsPlatform;
  if (!platform) throw new Error('Missing local shared platform bundle.');
  const { React, createRoot, App, Badge, Button, DatePicker, Divider, DownOutlined, Drawer, Dropdown, Empty,
    Form, Input, InputNumber, Modal, Select, Space, Tag, Typography,
    PlatformProvider, PlatformShell, PlatformQueryForm, PlatformTable,
    PlatformTableToolbar, PlatformModuleDescriptions, PlatformOverlayFormGrid, withModalDividers } = platform;
  const h = React.createElement;
  const spec = window.__OPS_PAGE_SPEC__;

  const formatValue = value => value === undefined || value === null || value === ''
    ? '—'
    : typeof value === 'object' ? value.text ?? value.value ?? '—' : String(value);
  const isEmpty = value => value === undefined || value === null || value === '' || Array.isArray(value) && value.length === 0;

  function renderControl(field) {
    const props = { style: { width: '100%' }, placeholder: field.placeholder || `请输入${field.label}` };
    if (field.control === 'select') return h(Select, { ...props, allowClear: true, placeholder: field.placeholder || `请选择${field.label}`, options: field.options || [] });
    if (field.control === 'date') return h(DatePicker, { ...props, format: field.format || 'YYYY-MM-DD' });
    if (field.control === 'date-range') return h(DatePicker.RangePicker, { ...props, format: field.format || 'YYYY-MM-DD', placeholder: ['开始日期', '结束日期'] });
    if (field.control === 'number') return h(InputNumber, { ...props, min: field.min, max: field.max, precision: field.precision });
    if (field.control === 'textarea') return h(Input.TextArea, { ...props, autoSize: { minRows: field.minRows || 5, maxRows: field.maxRows || 12 }, showCount: Boolean(field.maxLength), maxLength: field.maxLength });
    return h(Input, { ...props, allowClear: true, maxLength: field.maxLength });
  }

  function readField(row, field) {
    const value = row[field.key];
    if (field.format === 'status') return h(Badge, { className: 'ops-spec-status', status: field.statusTones?.[value] || field.statusTone || 'processing', text: formatValue(value) });
    if (field.format === 'category') return h(Tag, { className: 'ops-spec-category' }, formatValue(value));
    if (field.format === 'amount') return isEmpty(value) ? '—' : `${Number(value).toLocaleString('zh-CN', { minimumFractionDigits: field.precision ?? 2, maximumFractionDigits: field.precision ?? 2 })}`;
    return formatValue(value);
  }

  function matchRow(row, fields, values) {
    return (fields || []).every(field => {
      const value = values[field.key];
      if (isEmpty(value)) return true;
      const actual = row[field.filterKey || field.key];
      if (field.control === 'select') return String(actual) === String(value);
      if (field.control === 'date-range') {
        const start = value?.[0]?.format?.('YYYY-MM-DD');
        const end = value?.[1]?.format?.('YYYY-MM-DD');
        const date = String(actual || '').slice(0, 10);
        return (!start || date >= start) && (!end || date <= end);
      }
      return String(actual ?? '').toLocaleLowerCase().includes(String(value).toLocaleLowerCase());
    });
  }

  function applyAction(row, action, table, setRows, feedback, modal) {
    const update = () => {
      const next = { ...row, ...action.patch, updatedAt: new Date().toLocaleString('zh-CN', { hour12: false }) };
      setRows(current => current.map(item => item[table.rowKey] === row[table.rowKey] ? next : item));
      feedback.success(action.successMessage || '操作成功');
    };
    if (action.confirm) modal.confirm(withModalDividers({
      title: action.confirm.title || action.label,
      content: action.confirm.content || '确认执行此操作？',
      okText: action.confirm.okText || '确定',
      cancelText: action.confirm.cancelText || '取消',
      okButtonProps: action.danger ? { danger: true } : undefined,
      mask: { closable: true },
      onOk: update,
    }));
    else update();
  }

  function Detail({ record, onClose }) {
    const detail = spec.list.table.detail;
    if (!detail) return null;
    return h(Drawer, {
      className: 'platform-detail-overlay', title: detail.title, width: Math.min(detail.width || 860, window.innerWidth), open: Boolean(record), closable: { placement: 'end' }, onClose,
      footer: h('div', { className: 'platform-drawer-footer' }, h(Button, { onClick: onClose }, '关闭')),
    }, record && h('div', { className: 'page-stack' }, (detail.groups || []).map(group => h('section', { key: group.key, className: 'platform-detail-section' },
      h('h3', { className: 'ops-spec-detail-title' }, group.title),
      group.fields
        ? h(PlatformModuleDescriptions, { column: group.columns || 3, items: group.fields.map(field => ({
          key: field.key, label: field.label, span: field.span,
          children: h('span', { className: 'ops-spec-description-value' }, field.format === 'category'
            ? h(Tag, null, formatValue(record[field.key]))
            : field.format === 'status' ? h(Badge, { status: field.statusTones?.[record[field.key]] || field.tone || 'processing', text: formatValue(record[field.key]) })
              : formatValue(record[field.key])),
        })) })
        : h(PlatformTable, { size: 'middle', rowKey: group.rowKey || 'id', scroll: { x: 'max-content' }, columns: (group.columns || []).map(column => ({ key: column.key, title: column.format === 'amount' ? `${column.title}(${column.unit})` : column.title, dataIndex: column.key, width: column.width, align: column.align, render: (_, row) => readField(row, column) })), dataSource: record[group.dataKey] || [], pagination: { pageSize: 5, hideOnSinglePage: true } }),
    ))));
  }

  function ListPage() {
    const query = spec.list.query;
    const table = spec.list.table;
    const [form] = Form.useForm();
    const [createForm] = Form.useForm();
    const { message: feedback, modal } = App.useApp();
    const [applied, setApplied] = React.useState({});
    const [rows, setRows] = React.useState(table.rows || []);
    const [selected, setSelected] = React.useState(null);
    const [createOpen, setCreateOpen] = React.useState(false);
    const [density, setDensity] = React.useState('middle');
    const [currentPage, setCurrentPage] = React.useState(1);
    const [pageSize, setPageSize] = React.useState(table.pageSize || 10);
    const [visible, setVisible] = React.useState((table.columns || []).map(column => column.key));
    const shown = rows.filter(row => matchRow(row, query.fields, applied));
    const queryFields = query.fields || [];
    const actualColumns = (table.columns || []).filter(column => visible.includes(column.key)).map(column => ({
      key: column.key, title: column.format === 'amount' ? `${column.title}(${column.unit})` : column.title,
      dataIndex: column.key, width: column.width, ellipsis: column.ellipsis, align: column.align,
      render: (value, row) => readField(row, column),
    }));
    const rowActions = table.rowActions || [];
    if (table.detail || rowActions.length) actualColumns.push({
      key: 'action', title: '操作', fixed: 'right', width: table.actionWidth || (table.actionDisplay === 'expanded' ? 240 : 150),
      render: (_, row) => {
        const actions = [
          ...(table.detail ? [{ key: 'detail', label: '查看详情', onClick: () => setSelected(row) }] : []),
          ...rowActions.filter(action => !action.visibleWhen || String(row[action.visibleWhen.field]) === String(action.visibleWhen.value))
            .map(action => ({ key: `row-action:${action.key}`, label: action.label, danger: Boolean(action.danger),
              onClick: () => applyAction(row, action, table, setRows, feedback, modal) })),
        ];
        const actionButton = action => h(Button, { key: action.key, type: 'link', className: 'table-action-link',
          danger: action.danger, onClick: action.onClick }, action.label);
        if (table.actionDisplay === 'expanded') {
          const lines = [];
          for (let index = 0; index < actions.length; index += 3) {
            lines.push(h('div', { key: index, className: 'ops-spec-row-actions-line' }, ...actions.slice(index, index + 3).map(actionButton)));
          }
          return h('div', { className: 'ops-spec-row-actions-expanded' }, ...lines);
        }
        if (actions.length < 3) return h(Space, { size: 8 }, ...actions.map(actionButton));
        return h(Space, { size: 8 },
          actionButton(actions[0]),
          h(Dropdown, {
            key: 'more', trigger: ['click'],
            menu: {
              items: actions.slice(1).map((action, index) => ({ key: String(index + 1), label: action.label, danger: action.danger })),
              onClick: ({ key }) => actions[Number(key)]?.onClick(),
            },
          }, h(Button, { type: 'link', className: 'table-action-link', icon: h(DownOutlined),
            iconPlacement: 'end' }, '更多')),
        );
      },
    });
    function refresh() { setApplied(current => ({ ...current })); feedback.success('列表已刷新'); }
    function submit(values) { setApplied(values); setCurrentPage(1); }
    const submitting = React.useRef(false);
    function create(values) {
      if (submitting.current) return;
      submitting.current = true;
      const normalized = Object.fromEntries(Object.entries(values).map(([key, value]) => {
        const field = table.create.form.fields.find(item => item.key === key);
        if (field?.control === 'date') return [key, value?.format('YYYY-MM-DD') ?? null];
        if (field?.control === 'date-range') return [key, value?.map(item => item.format('YYYY-MM-DD')).join(' ~ ') ?? null];
        return [key, value];
      }));
      const id = `${table.idPrefix || 'SPEC'}${Date.now()}`;
      const row = { ...table.create.defaults, ...normalized, [table.rowKey]: id };
      setRows(current => [row, ...current]);
      setApplied({}); form.resetFields(); setCurrentPage(1);
      setCreateOpen(false); createForm.resetFields();
      feedback.success(table.create.successMessage || '新增成功');
    }
    const createModal = table.create && h(Modal, {
      title: table.create.form.title, open: createOpen, width: table.create.width || 640,
      onCancel: () => setCreateOpen(false), onOk: () => createForm.submit(),
      okText: table.create.form.submit?.label || '保存', cancelText: '取消',
    }, h(Form, { form: createForm, layout: 'vertical', onFinish: create }, h(PlatformOverlayFormGrid, { columns: 2 },
      (table.create.form.fields || []).map(field => h(Form.Item, {
        key: field.key, name: field.key, label: field.label,
        className: field.wide ? 'platform-overlay-form-wide' : '',
        rules: field.required ? [{ required: true, message: `${field.control === 'select' ? '请选择' : '请输入'}${field.label}` }] : [],
      }, renderControl(field))),
    )));
    return h('div', { className: 'page-stack' },
      h(PlatformQueryForm, { form, columns: query.columns || 3, collapsible: Boolean(query.collapseThreshold), onFinish: submit,
        actions: h(React.Fragment, null,
          h(Button, { type: 'primary', htmlType: 'submit' }, '查询'),
          h(Button, { onClick: () => { form.resetFields(); setApplied({}); setCurrentPage(1); } }, '重置')),
      }, queryFields.map(field => h(Form.Item, { key: field.key, name: field.key, label: field.label }, renderControl(field)))),
      h(Divider, { style: { margin: 0, borderColor: window.__OPS_PLATFORM_CONFIG__.layout.queryDividerColor } }),
      h('section', { className: 'table-region' },
        h(PlatformTableToolbar, { title: table.title, onRefresh: refresh, size: density, onSizeChange: setDensity,
          columnOptions: table.columns.map(column => ({ key: column.key, label: column.format === 'amount' ? `${column.title}(${column.unit})` : column.title })),
          visibleColumnKeys: visible, onVisibleColumnKeysChange: setVisible,
          primaryAction: table.create && h(Button, { type: 'primary', onClick: () => { submitting.current = false; setCreateOpen(true); } }, table.create.label),
        }),
        h(PlatformTable, { size: density, rowKey: table.rowKey, columns: actualColumns, dataSource: shown,
          scroll: { x: table.scrollX || 'max-content' }, pagination: {
            current: currentPage, pageSize, onChange: (page, size) => { setCurrentPage(page); setPageSize(size); },
            showSizeChanger: true, pageSizeOptions: [10, 20, 50], showTotal: total => `共 ${total} 条`,
          }, locale: { emptyText: h(Empty, { description: '暂无符合条件的记录，请调整查询条件' }) },
        })),
      createModal,
      h(Detail, { record: selected, onClose: () => setSelected(null) }),
    );
  }

  const pages = [{ key: spec.shell.pageKey, title: spec.metadata.title, group: spec.shell.group,
    projectKeys: [spec.shell.projectKey], layout: 'plain', render: () => h(ListPage) }];
  createRoot(document.getElementById('root')).render(
    h(PlatformProvider, null, h(PlatformShell, { pages })),
  );
}());
