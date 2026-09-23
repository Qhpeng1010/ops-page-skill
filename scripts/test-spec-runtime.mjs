import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { mkdtemp, readFile, mkdir, writeFile, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { verifySpecRuntime } from './lib/spec-runtime-integrity.mjs';
import { validateOpsPageSpec } from './validate-ops-page-spec.mjs';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const runtime = resolve(root, 'modules/operations/runtime');

test('bundle contains canonical platform and rejects framework drift', async t => {
  const manifest = await verifySpecRuntime(root);
  assert.equal(manifest.versions.react.split('.')[0], '19');
  assert.equal(manifest.versions.antd.split('.')[0], '6');
  const copy = await mkdtemp(resolve(tmpdir(), 'ops-platform-integrity-'));
  t.after(() => rm(copy, { recursive: true, force: true }));
  for (const file of [...Object.keys(manifest.sources), ...Object.keys(manifest.assets).map(name => `modules/operations/runtime/vendor/${name}`), 'modules/operations/runtime/vendor/manifest.json']) {
    await mkdir(dirname(resolve(copy, file)), { recursive: true });
    await writeFile(resolve(copy, file), await readFile(resolve(root, file)));
  }
  await verifySpecRuntime(copy);
  const shell = resolve(copy, 'modules/operations/shell/PlatformShell.tsx');
  await writeFile(shell, (await readFile(shell, 'utf8')) + '\n// a framework change\n');
  await assert.rejects(verifySpecRuntime(copy), /stale/);
});

test('spec uses actual shared Provider/Shell and public query/table/detail components', async () => {
  const config = JSON.parse(await readFile(resolve(root, 'modules/operations/platform.config.json'), 'utf8'));
  const spec = {
    metadata: { title: '测试订单' }, shell: { projectKey: 'platform-settings', pageKey: 'orders', group: '交易管理' },
    list: { query: { fields: [{ key: 'orderNo', label: '订单编号', control: 'input' }] }, table: {
      rowKey: 'orderNo', title: '订单列表', columns: [{ key: 'orderNo', title: '订单编号' }, { key: 'amount', title: '订单金额', format: 'amount', unit: '元' }],
      rows: [{ orderNo: 'O1', amount: 12, status: '启用' }, { orderNo: 'O2', amount: 30, status: '启用' }],
      create: { label: '新增', defaults: { amount: 10 }, form: { title: '新增订单', fields: [{ key: 'amount', label: '金额', control: 'number' }] } },
      detail: { title: '订单详情', groups: [{ key: 'basic', title: '订单信息', fields: [{ key: 'orderNo', label: '订单编号' }] }] },
      rowActions: [{ key: 'disable', label: '禁用', visibleWhen: { field: 'status', value: '启用' }, patch: { status: '禁用' },
        confirm: { title: '禁用订单', content: '确认禁用吗？', okText: '确认禁用' } }],
    } },
  };
  const context = vm.createContext({ console, setTimeout, clearTimeout, performance, TextEncoder, TextDecoder, URL, queueMicrotask });
  context.window = context;
  context.__OPS_PLATFORM_CONFIG__ = config;
  context.__OPS_PAGE_SPEC__ = spec;
  vm.runInContext(await readFile(resolve(runtime, 'vendor/ops-platform.js'), 'utf8'), context);
  const actual = context.OpsPlatform;
  assert.equal(actual.React.version, '19.3.0');
  let mounted;
  let confirmOptions;
  let cursor = 0;
  const state = [];
  const form = { resetFields() {}, submit() {} };
  context.OpsPlatform = { ...actual,
    createRoot: () => ({ render: element => { mounted = element; } }),
    React: { ...actual.React, useState(initial) { const index = cursor++; if (!(index in state)) state[index] = initial; return [state[index], next => { state[index] = typeof next === 'function' ? next(state[index]) : next; }]; }, useRef: () => ({ current: false }) },
    Form: Object.assign(() => null, { Item: actual.Form.Item, useForm: () => [form] }),
    App: { useApp: () => ({ message: { success() {} }, modal: { confirm(options) { confirmOptions = options; } } }) },
  };
  context.document = { getElementById: () => ({}) };
  vm.runInContext(await readFile(resolve(runtime, 'ops-page-spec-runtime.js'), 'utf8'), context);
  assert.equal(mounted.type, actual.PlatformProvider);
  const shell = mounted.props.children;
  assert.equal(shell.type, actual.PlatformShell);
  assert.equal(shell.props.pages[0].layout, 'plain');
  assert.equal(shell.props.pages[0].projectKeys[0], spec.shell.projectKey);
  const page = shell.props.pages[0].render();
  function render() { cursor = 0; return page.type().props.children; }
  let [query, divider, region, createModal, detail] = render();
  assert.equal(query.type, actual.PlatformQueryForm);
  assert.equal(query.props.columns, 3);
  assert.equal(query.props.layout, undefined); // shared horizontal default
  assert.equal(divider.props.style.margin, 0);
  assert.equal(region.props.children[0].type, actual.PlatformTableToolbar);
  assert.equal(region.props.children[1].type, actual.PlatformTable);
  assert.equal(region.props.children[1].props.columns[1].title, '订单金额(元)');
  assert.equal(region.props.children[1].props.dataSource.length, 2);
  const actions = region.props.children[1].props.columns.at(-1).render(undefined, spec.list.table.rows[0]);
  assert.equal(actions.props.children.length, 2);
  assert.equal(actions.props.children.some(child => child?.type === actual.Dropdown), false);
  actions.props.children.find(child => child.props.children === '禁用').props.onClick();
  assert.equal(confirmOptions.type, 'warning');
  assert.ok(confirmOptions.icon);
  assert.equal(confirmOptions.title.props.children, '禁用订单');
  assert.equal(confirmOptions.content, '确认禁用吗？');
  assert.equal(typeof confirmOptions.footer, 'function');
  assert.equal(confirmOptions.mask.closable, true);
  confirmOptions.onOk();
  region = render()[2];
  assert.equal(region.props.children[1].props.dataSource[0].status, '禁用');
  query.props.onFinish({ orderNo: 'O2' });
  region = render()[2];
  assert.equal(region.props.children[1].props.dataSource.length, 1);
  assert.equal(region.props.children[1].props.dataSource[0].orderNo, 'O2');
  const drawer = detail.type({ record: spec.list.table.rows[0], onClose() {} });
  assert.equal(drawer.type, actual.Drawer);
  assert.equal(drawer.props.closable.placement, 'end');
  assert.equal(drawer.props.children.props.className, 'page-stack');
  assert.equal(drawer.props.children.props.children[0].props.className, 'platform-detail-section');
  assert.equal(drawer.props.children.props.children[0].props.children[1].type, actual.PlatformModuleDescriptions);
  const createForm = createModal.props.children;
  assert.equal(createForm.props.children.type, actual.PlatformOverlayFormGrid);
  createForm.props.onFinish({ amount: 50 });
  region = render()[2];
  assert.equal(region.props.children[1].props.dataSource.length, 3);
  assert.equal(region.props.children[1].props.dataSource[0].amount, 50); // entered value wins over defaults

  spec.list.table.rowActions.push(
    { key: 'edit', label: '编辑', visibleWhen: { field: 'status', value: '禁用' }, patch: { edited: true } },
    { key: 'remove', label: '删除', danger: true, visibleWhen: { field: 'status', value: '禁用' },
      confirm: { title: '确认删除', content: '确定删除记录吗？' }, patch: { removed: true } },
  );
  query.props.onFinish({});
  region = render()[2];
  const actionColumn = region.props.children[1].props.columns.at(-1);
  const enabledActions = actionColumn.render(undefined, spec.list.table.rows[1]);
  assert.equal(enabledActions.props.children.length, 2); // conditional actions are counted per row
  assert.equal(enabledActions.props.children.some(child => child?.type === actual.Dropdown), false);
  const disabledRow = region.props.children[1].props.dataSource.find(row => row.orderNo === 'O1');
  const collapsedActions = actionColumn.render(undefined, disabledRow);
  assert.equal(collapsedActions.props.children[0].props.children, '查看详情');
  const more = collapsedActions.props.children[1];
  assert.equal(more.type, actual.Dropdown);
  assert.equal(more.props.children.props.children, '更多');
  assert.deepEqual(Array.from(more.props.menu.items, item => item.label), ['编辑', '删除']);
  assert.equal(more.props.menu.items[1].danger, true);
  more.props.menu.onClick({ key: '2' });
  assert.equal(confirmOptions.type, 'warning');
  assert.equal(confirmOptions.title.props.children, '确认删除');
  assert.equal(confirmOptions.content, '确定删除记录吗？');
  assert.equal(confirmOptions.okButtonProps.danger, true);
  confirmOptions.onOk();
  region = render()[2];
  assert.equal(region.props.children[1].props.dataSource.find(row => row.orderNo === 'O1').removed, true);

  spec.list.table.actionDisplay = 'expanded';
  spec.list.table.rowActions.push({ key: 'export', label: '导出', visibleWhen: { field: 'status', value: '禁用' }, patch: { exported: true } });
  region = render()[2];
  const expandedColumn = region.props.children[1].props.columns.at(-1);
  assert.equal(expandedColumn.width, 240);
  const expandedActions = expandedColumn.render(undefined, disabledRow);
  assert.equal(expandedActions.props.className, 'ops-spec-row-actions-expanded');
  assert.deepEqual(Array.from(expandedActions.props.children, line =>
    Array.from(Array.isArray(line.props.children) ? line.props.children : [line.props.children], child => child.props.children)),
    [['查看详情', '编辑', '删除'], ['导出']]);
});

test('spec action display accepts only explicit expanded override', () => {
  const spec = {
    schemaVersion: 1,
    runtime: 'ops-page-spec',
    metadata: { changeId: 'action-display', title: '操作展示测试', family: 'list', request: '测试列表操作展示方式' },
    shell: { projectKey: 'platform-settings', group: '测试', pageKey: 'action-display' },
    list: {
      query: { fields: [{ key: 'keyword', label: '关键词', control: 'input' }] },
      table: { rowKey: 'id', title: '测试列表', columns: [{ key: 'id', title: 'ID' }], rows: [{ id: 'T001' }] },
    },
  };
  assert.equal(validateOpsPageSpec(spec).valid, true);
  spec.list.table.actionDisplay = 'expanded';
  assert.equal(validateOpsPageSpec(spec).valid, true);
  spec.list.table.actionDisplay = 'other';
  assert.match(validateOpsPageSpec(spec).errors.join(' '), /actionDisplay/);
});
