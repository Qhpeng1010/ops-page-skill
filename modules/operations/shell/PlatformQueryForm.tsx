import { Children, useState, type CSSProperties, type ReactNode } from 'react';
import { Button, Form, Space, type FormProps } from 'antd';
import { DownOutlined, UpOutlined } from '@ant-design/icons';

export type PlatformQueryColumns = 3 | 4;

export type PlatformQueryFormProps = Omit<FormProps, 'children'> & {
  /** The only supported desktop layouts are three or four columns. */
  columns?: PlatformQueryColumns;
  /** Add an expand / collapse control when there are more fields than columns. */
  collapsible?: boolean;
  defaultExpanded?: boolean;
  children?: ReactNode;
  /** Query and reset actions. They are always placed in the last grid column. */
  actions?: ReactNode;
};

function normalizeColumns(columns: number | undefined): PlatformQueryColumns {
  return columns === 4 ? 4 : 3;
}

export function PlatformQueryForm({
  columns,
  collapsible = false,
  defaultExpanded = false,
  children,
  actions,
  className,
  layout = 'horizontal',
  ...formProps
}: PlatformQueryFormProps) {
  const columnCount = normalizeColumns(columns);
  const items = Children.toArray(children);
  const canCollapse = collapsible && items.length > columnCount;
  const [expanded, setExpanded] = useState(defaultExpanded || !canCollapse);
  const visibleItems = canCollapse && !expanded ? items.slice(0, columnCount) : items;

  return <Form {...formProps} layout={layout} className={['platform-query-form', className].filter(Boolean).join(' ')}>
    <div className="platform-query-grid" style={{ '--ops-query-columns': columnCount } as CSSProperties}>
      {visibleItems}
      {(actions || canCollapse) && <div className="platform-query-actions">
        <Space size={8} wrap>
          {actions}
          {canCollapse && <Button type="link" icon={expanded ? <UpOutlined /> : <DownOutlined />} iconPlacement="end"
            aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>
            {expanded ? '收起' : '展开'}
          </Button>}
        </Space>
      </div>}
    </div>
  </Form>;
}
