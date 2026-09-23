import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, App, Badge, Button, Card, Descriptions, Divider, Drawer, Empty, Form, Input, Modal, Select, Space, Switch, Table, Typography, type TableColumnsType } from 'antd';
import { SettingFilled, ShopFilled } from '@ant-design/icons';
import type { PageContext, PlatformPage } from './platform/PlatformShell';
import { PlatformModule, PlatformModuleDescriptions, PlatformModuleFormGrid, PlatformOverlayFormGrid, PlatformPageFooter } from './platform/PlatformModule';
import { PlatformTableToolbar } from './platform/PlatformTableToolbar';
import { PlatformTable } from './platform/PlatformTable';
import { PlatformQueryForm } from './platform/PlatformQueryForm';
import { PlatformTableValue } from './platform/PlatformTableValue';
import config from './platform/platform.config.json';
import { withModalDividers } from './platform/modalDividers';
import { queryMerchants, type Merchant, type Query } from './data/merchants';

type ModalExampleValues = {
  name: string;
  scope: 'all' | 'active' | 'pending';
  note?: string;
  enabled: boolean;
};

function MerchantQuery() {
  const { message } = App.useApp();
  const [form] = Form.useForm<Query>();
  const [exampleOpen, setExampleOpen] = useState(false);
  const [savedExample, setSavedExample] = useState<ModalExampleValues>();
  const [rows, setRows] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Merchant>();
  const [applied, setApplied] = useState<Query>({});
  const [tableSize, setTableSize] = useState<'small' | 'middle' | 'large'>('middle');
  const [visibleColumnKeys, setVisibleColumnKeys] = useState(['id', 'name', 'shortName', 'status', 'category', 'registeredAt', 'action']);
  const request = useRef<AbortController | undefined>(undefined);

  async function search(query: Query) {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setApplied(query); setLoading(true); setError('');
    try {
      const next = await queryMerchants(query, controller.signal);
      if (!controller.signal.aborted) { setRows(next); setPage(1); }
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : '查询失败，请重试');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }
  useEffect(() => { void search({}); return () => request.current?.abort(); }, []);
  const status = (value: Merchant['status']) => <PlatformTableValue kind="status" display="status"
    status={value === 'active' ? 'success' : 'processing'} label={value === 'active' ? '正常' : '待审核'} />;
  const category = (value: Merchant['category']) => <PlatformTableValue kind="category" display="tag"
    label={value === 'enterprise' ? '企业商户' : '个人商户'} />;
  const columns: TableColumnsType<Merchant> = [
    { key: 'id', title: '商户编号', dataIndex: 'id', width: 160 },
    { key: 'name', title: '商户签约名', dataIndex: 'name', width: 220 },
    { key: 'shortName', title: '商户简称', dataIndex: 'shortName', width: 140 },
    { key: 'status', title: '商户状态', dataIndex: 'status', width: 140, render: status },
    { key: 'category', title: '商户类型', dataIndex: 'category', width: 140, render: category },
    { key: 'registeredAt', title: '注册日期', dataIndex: 'registeredAt', width: 160 },
    { title: '操作', key: 'action', width: 100, align: 'left', render: (_, record) => <Button type="link" className="table-action-link" onClick={() => setSelected(record)}>查看</Button> },
  ];
  const visibleColumns = useMemo(() => columns.filter(column => visibleColumnKeys.includes(String(column.key))), [columns, visibleColumnKeys]);
  const columnOptions = [
    { key: 'id', label: '商户编号' }, { key: 'name', label: '商户签约名' }, { key: 'shortName', label: '商户简称' },
    { key: 'status', label: '商户状态' }, { key: 'category', label: '商户类型' }, { key: 'registeredAt', label: '注册日期' }, { key: 'action', label: '操作' },
  ];
  return <div className="page-stack">
    <PlatformQueryForm form={form} columns={3} collapsible onFinish={query => void search(query)}
      actions={<Space size={config.layout.buttonGap} wrap>
        <Button type="primary" htmlType="submit" loading={loading}>查询</Button>
        <Button disabled={loading} onClick={() => { form.resetFields(); void search({}); }}>重置</Button>
      </Space>}>
      <Form.Item name="id" label="商户编号"><Input allowClear placeholder="请输入商户编号" /></Form.Item>
      <Form.Item name="name" label="商户名称"><Input allowClear placeholder="请输入商户签约名" /></Form.Item>
      <Form.Item name="status" label="商户状态"><Select allowClear placeholder="请选择状态" options={[
        { value: 'active', label: '正常' }, { value: 'pending', label: '待审核' },
      ]} /></Form.Item>
      <Form.Item name="registeredAt" label="注册日期"><Select allowClear placeholder="请选择日期" options={[
        { value: '2026-09-01', label: '2026-09-01' }, { value: '2026-09-02', label: '2026-09-02' },
      ]} /></Form.Item>
    </PlatformQueryForm>
    <Divider className="query-divider" style={{ margin: 0, height: 1, border: 0, background: config.layout.queryDividerColor }} />
    <div className="query-results page-stack">
      {savedExample && <Alert type="success" title={`已保存示例配置：${savedExample.name}`} />}
      {error && <Alert type="error" title={error} showIcon action={<Button onClick={() => void search(applied)}>重试</Button>} />}
      <div className="table-region">
        <PlatformTableToolbar title="商户列表" size={tableSize} onSizeChange={setTableSize}
          refreshLoading={loading} onRefresh={() => void search(applied)} columnOptions={columnOptions}
          visibleColumnKeys={visibleColumnKeys} onVisibleColumnKeysChange={setVisibleColumnKeys}
          primaryAction={<Button type="primary" onClick={() => setExampleOpen(true)}>弹窗示例</Button>} />
        <PlatformTable size={tableSize} rowKey="id" columns={visibleColumns} dataSource={rows} loading={loading}
        scroll={{ x: 1060 }} locale={{ emptyText: <Empty description="没有符合条件的商户，请调整查询条件" /> }}
        pagination={{ current: page, pageSize: 10, total: rows.length, showSizeChanger: false, onChange: setPage, showTotal: total => `共 ${total} 条` }} />
      </div>
    </div>
    <Drawer title="商户详情" closable={{ placement: 'end' }} open={!!selected} onClose={() => setSelected(undefined)}
      footer={<div className="platform-drawer-footer"><Space size={config.layout.buttonGap}><Button onClick={() => setSelected(undefined)}>关闭</Button></Space></div>}>
      {selected && <div className="platform-detail-section"><Descriptions column={1} items={[
        { key: 'id', label: '商户编号', children: <Typography.Text copyable>{selected.id}</Typography.Text> },
        { key: 'name', label: '商户签约名', children: selected.name },
        { key: 'short', label: '商户简称', children: selected.shortName },
        { key: 'status', label: '商户状态', children: status(selected.status) },
        { key: 'category', label: '商户类型', children: category(selected.category) },
        { key: 'date', label: '注册日期', children: selected.registeredAt },
      ]} /></div>}
    </Drawer>
    <Modal title="弹窗示例" open={exampleOpen} centered width={520} destroyOnHidden
      mask={{ closable: true }} onCancel={() => setExampleOpen(false)}
      okText="保存" cancelText="取消"
      okButtonProps={{ htmlType: 'submit', form: 'merchant-modal-example' }}>
      <Form<ModalExampleValues> name="merchant-modal-example" layout="vertical" preserve={false}
        initialValues={savedExample ?? { scope: 'all', enabled: true }}
        onFinish={values => {
          setSavedExample({ ...values, name: values.name.trim(), note: values.note?.trim() });
          setExampleOpen(false);
          void message.success('示例配置已保存');
        }}>
        <PlatformOverlayFormGrid>
        <Form.Item name="name" label="配置名称"
          rules={[{ required: true, whitespace: true, message: '请输入配置名称' }]}>
          <Input placeholder="请输入配置名称" maxLength={40} />
        </Form.Item>
        <Form.Item name="scope" label="适用范围" rules={[{ required: true, message: '请选择适用范围' }]}>
          <Select options={[
            { value: 'all', label: '全部商户' },
            { value: 'active', label: '正常商户' },
            { value: 'pending', label: '待审核商户' },
          ]} />
        </Form.Item>
        <Form.Item name="note" label="备注" className="platform-overlay-form-wide">
          <Input.TextArea placeholder="请输入备注（选填）" autoSize={{ minRows: 3, maxRows: 5 }} maxLength={200} showCount />
        </Form.Item>
        <Form.Item name="enabled" label="启用配置" valuePropName="checked" style={{ marginBottom: 0 }}>
          <Switch aria-label="启用配置" />
        </Form.Item>
        </PlatformOverlayFormGrid>
      </Form>
    </Modal>
  </div>;
}

function ComponentPreview({ openPage }: PageContext) {
  const { message, modal } = App.useApp();
  return <div className="page-stack">
    <Typography.Title level={4} style={{ margin: 0 }}>平台组件预览</Typography.Title>
    <Card title="操作与反馈"><Space wrap>
      <Button type="primary" onClick={() => void message.success('消息提示继承当前主题')}>主操作</Button>
      <Button onClick={() => modal.info(withModalDividers({ title: '主题预览', content: '弹窗和按钮使用同一平台主题。', mask: { closable: true } }))}>打开弹窗</Button>
      <Button danger onClick={() => modal.confirm(withModalDividers({ title: '危险操作样式预览', content: '此示例不删除数据。', mask: { closable: true }, okButtonProps: { danger: true }, onOk: () => { void message.info('已完成样式预览'); } }))}>危险操作</Button>
      <Button disabled>禁用状态</Button>
    </Space></Card>
    <Card title="新标签页布局"><Space wrap>
      <Button onClick={() => openPage('single-module-example')}>单模块新标签页</Button>
      <Button onClick={() => openPage('multi-module-example')}>多模块新标签页</Button>
      <Button onClick={() => openPage('multi-module-form-example')}>多模块表单页</Button>
    </Space></Card>
    <Card title="输入与状态"><Form name="component-preview" layout="vertical" initialValues={{ scope: 'all', enabled: true }} style={{ maxWidth: 480 }}>
      <Form.Item name="name" label="名称"><Input placeholder="请输入名称" /></Form.Item>
      <Form.Item name="scope" label="范围"><Select options={[{ value: 'all', label: '全部' }, { value: 'mine', label: '仅本人' }]} /></Form.Item>
      <Form.Item name="enabled" label="启用" valuePropName="checked"><Switch aria-label="启用" /></Form.Item>
    </Form><Space size={config.layout.elementGap} wrap><Badge status="success" text="正常" /><Badge status="processing" text="处理中" /><Badge status="error" text="失败" /></Space></Card>
  </div>;
}

function SingleModulePreview({ openPage }: PageContext) {
  const [saved, setSaved] = useState<{ name: string; scope: string }>();
  return <PlatformModule title="新增配置">
    <div className="page-stack">
      {saved && <Alert type="success" title={`已保存本页示例配置：${saved.name}`} />}
      <Form name="single-module-example" layout="vertical" style={{ maxWidth: 640 }}
        initialValues={{ scope: 'all' }} onFinish={values => setSaved({ name: values.name.trim(), scope: values.scope })}>
        <Form.Item name="name" label="配置名称" rules={[{ required: true, whitespace: true, message: '请输入配置名称' }]}>
          <Input placeholder="请输入配置名称" maxLength={40} />
        </Form.Item>
        <Form.Item name="scope" label="适用范围"><Select options={[
          { value: 'all', label: '全部商户' }, { value: 'active', label: '正常商户' },
        ]} /></Form.Item>
        <Space wrap>
          <Button type="primary" htmlType="submit">保存</Button>
          <Button onClick={() => openPage('components')}>返回</Button>
        </Space>
      </Form>
    </div>
  </PlatformModule>;
}

function MultiModuleFormPreview({ openPage }: PageContext) {
  const [form] = Form.useForm();
  const [saved, setSaved] = useState(false);
  return <div className="platform-module-form-page">
    <Form form={form} layout="vertical" name="multi-module-form-example"
      initialValues={{ scope: 'all', enabled: true }}
      onFinish={() => setSaved(true)}>
      <PlatformModule title="基础信息">
        <PlatformModuleFormGrid>
          <Form.Item name="name" label="配置名称" rules={[{ required: true, whitespace: true, message: '请输入配置名称' }]}>
            <Input placeholder="请输入配置名称" maxLength={40} />
          </Form.Item>
          <Form.Item name="scope" label="适用范围"><Select options={[
            { value: 'all', label: '全部商户' }, { value: 'active', label: '正常商户' },
          ]} /></Form.Item>
          <Form.Item name="enabled" label="启用配置" valuePropName="checked">
            <Switch aria-label="启用配置" />
          </Form.Item>
        </PlatformModuleFormGrid>
      </PlatformModule>
      <PlatformModule title="补充信息">
        <PlatformModuleFormGrid>
          <Form.Item name="owner" label="负责人"><Input placeholder="请输入负责人" /></Form.Item>
          <Form.Item name="contact" label="联系电话"><Input placeholder="请输入联系电话" /></Form.Item>
          <Form.Item name="note" label="备注" className="platform-module-form-wide">
            <Input.TextArea placeholder="请输入备注（选填）" maxLength={200} showCount autoSize={{ minRows: 3, maxRows: 5 }} />
          </Form.Item>
        </PlatformModuleFormGrid>
      </PlatformModule>
      <PlatformPageFooter summary={saved ? '已保存本页示例配置' : undefined}
        secondaryActions={<Button onClick={() => { form.resetFields(); setSaved(false); }}>取消</Button>}
        primaryAction={<Button type="primary" htmlType="submit">保存</Button>} />
    </Form>
  </div>;
}

function MultiModulePreview({ openPage }: PageContext) {
  const [view, setView] = useState('overview');
  const [ruleTab, setRuleTab] = useState('rules');
  const [merchant, setMerchant] = useState<string>('DEMO0001');
  const merchantName = merchant === 'DEMO0002' ? '示例商户 2' : '示例商户 1';
  const relatedPeople = [
    { id: 'legal', role: '法人', name: '示例联系人 A', phone: '138****7877', documentType: '身份证', merchantId: merchant },
    { id: 'contact', role: '联系人', name: '示例联系人 B', phone: '139****1234', documentType: '身份证', merchantId: merchant },
  ];
  return <>
    <PlatformModule tabs={{
      activeKey: view, onChange: setView,
      items: [{ key: 'overview', label: '客户总体情况' }, { key: 'transactions', label: '客户交易情况' }],
      tabBarExtraContent: <Button onClick={() => openPage('components')}>返回</Button>,
    }}>
      <Form name="module-merchant-filter" layout="vertical">
        <PlatformModuleFormGrid>
          <Form.Item label="商户">
            <Select aria-label="选择商户" placeholder="请选择商户" style={{ width: '100%' }}
              value={merchant} onChange={setMerchant}
              options={[{ value: 'DEMO0001', label: '示例商户 1' }, { value: 'DEMO0002', label: '示例商户 2' }]} />
          </Form.Item>
        </PlatformModuleFormGrid>
      </Form>
    </PlatformModule>
    {view === 'overview' ? <>
    <PlatformModule title="基本信息" detail>
      <PlatformModuleDescriptions items={[
        { key: 'id', label: '商户编号', children: merchant },
        { key: 'name', label: '商户名称', children: merchantName },
        { key: 'status', label: '商户状态', children: <PlatformTableValue kind="status" status="success" label="正常" /> },
        { key: 'type', label: '商户类型', children: <PlatformTableValue kind="category" label="企业商户" /> },
        { key: 'document', label: '证件类型', children: '营业执照' },
        { key: 'date', label: '注册日期', children: merchant === 'DEMO0002' ? '2026-09-02' : '2026-09-01' },
        { key: 'company', label: '管理机构', children: '示例分公司' },
        { key: 'address', label: '注册地址', children: '示例路 1 号' },
        { key: 'website', label: '网站', children: 'www.example.com' },
      ]} />
    </PlatformModule>
    <PlatformModule title="关联人信息" hasTable>
      <Table size="middle" rowKey="id" pagination={false} dataSource={relatedPeople} scroll={{ x: 720 }}
        columns={[
          { title: '关联人类型', dataIndex: 'role' }, { title: '客户姓名', dataIndex: 'name' },
          { title: '联系电话', dataIndex: 'phone' },
          { title: '证件类型', dataIndex: 'documentType', render: value => <PlatformTableValue kind="category" label={value} /> },
          { title: '所属商户', dataIndex: 'merchantId' },
        ]} />
    </PlatformModule>
    <PlatformModule title="预审规则组" description="预审环节，需要先过机审，机审失败放行后，需要配置审核策略">
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据" />
    </PlatformModule>
    <PlatformModule title="结算风险规则组" tabs={{ activeKey: ruleTab, onChange: setRuleTab, items: [
      { key: 'rules', label: '规则配置', children: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无规则配置" /> },
      { key: 'history', label: '执行记录', children: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无执行记录" /> },
    ] }} />
    <PlatformModule title="商户结构风险规则组"><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据" /></PlatformModule>
    </> : <>
      <PlatformModule title="交易概况"><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无交易统计" /></PlatformModule>
      <PlatformModule title="交易明细" hasTable>
        <Table size="middle" rowKey="id" pagination={false} dataSource={[]}
          columns={[{ title: '交易编号', dataIndex: 'id' }, { title: '交易金额(元)', dataIndex: 'amount', align: 'right' },
            { title: '交易状态', dataIndex: 'status' }, { title: '交易时间', dataIndex: 'createdAt' }]}
          scroll={{ x: 640 }} locale={{ emptyText: '暂无交易记录' }} />
      </PlatformModule>
    </>}
  </>;
}

export const pages: PlatformPage[] = [
  { key: 'merchants', title: '商户查询', group: '商户管理', projectKeys: ['merchant-service'], icon: <ShopFilled />, render: () => <MerchantQuery /> },
  { key: 'components', title: '组件预览', group: '平台样式', icon: <SettingFilled />, render: context => <ComponentPreview {...context} /> },
  { key: 'single-module-example', title: '单模块示例', group: '平台样式', showInMenu: false,
    layout: 'single-module', render: context => <SingleModulePreview {...context} /> },
  { key: 'multi-module-example', title: '多模块示例', group: '平台样式', showInMenu: false,
    layout: 'multi-module', render: context => <MultiModulePreview {...context} /> },
  { key: 'multi-module-form-example', title: '多模块表单页', group: '平台样式', showInMenu: false,
    layout: 'multi-module', render: context => <MultiModuleFormPreview {...context} /> },
];
