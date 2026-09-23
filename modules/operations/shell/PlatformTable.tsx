import { Table, type TableColumnsType, type TableProps } from 'antd';

export type PlatformTableAlign = 'left' | 'center' | 'right';

export type PlatformTableProps<RecordType extends object> = TableProps<RecordType> & {
  /** Alignment applied to columns that do not declare their own align value. */
  columnAlign?: PlatformTableAlign;
};

function isOperationColumn(column: any) {
  const key = typeof column.key === 'string' ? column.key : '';
  const dataIndex = typeof column.dataIndex === 'string' ? column.dataIndex : '';
  const title = typeof column.title === 'string' ? column.title : '';
  return key === 'action' || key === 'actions' || dataIndex === 'action' || dataIndex === 'actions' || title === '操作';
}

/**
 * Ant Table with platform defaults. Per-column align/fixed values always win.
 * Operation columns are fixed to the right when the table needs horizontal scrolling.
 */
export function PlatformTable<RecordType extends object>({
  columns,
  columnAlign = 'left',
  ...props
}: PlatformTableProps<RecordType>) {
  const alignedColumns = columns?.map(column => {
    const next = column.align ? column : { ...column, align: columnAlign };
    if (Object.prototype.hasOwnProperty.call(next, 'fixed') || !isOperationColumn(next)) return next;
    return { ...next, fixed: 'right' as const };
  }) as TableColumnsType<RecordType> | undefined;
  const hasFixedOperation = alignedColumns?.some(column => column.fixed === 'right') ?? false;
  const scroll = hasFixedOperation && props.scroll == null ? { x: 'max-content' as const } : props.scroll;
  return <Table {...props} columns={alignedColumns} scroll={scroll} />;
}
