import type { ReactNode } from 'react';
import { Button, Checkbox, Dropdown, Space, Tooltip, Typography, type MenuProps } from 'antd';
import { ColumnHeightOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons';
import config from './platform.config.json';

export type PlatformTableColumnOption = { key: string; label: ReactNode };
export type PlatformTableDensity = 'small' | 'middle' | 'large';
export type PlatformTableToolbarProps = {
  title?: ReactNode;
  /** Legacy escape hatch; prefer secondaryActions / primaryAction for table business actions. */
  extra?: ReactNode;
  /** Secondary business actions, rendered before the primary action. */
  secondaryActions?: ReactNode;
  /** Primary business action, rendered immediately before the settings actions. */
  primaryAction?: ReactNode;
  showTitle?: boolean;
  showRefresh?: boolean;
  showDensity?: boolean;
  showColumnSettings?: boolean;
  refreshLoading?: boolean;
  onRefresh?: () => void;
  size?: PlatformTableDensity;
  onSizeChange?: (size: PlatformTableDensity) => void;
  columnOptions?: PlatformTableColumnOption[];
  visibleColumnKeys?: string[];
  onVisibleColumnKeysChange?: (keys: string[]) => void;
};

const densityOptions: Array<{ key: PlatformTableDensity; label: string }> = [
  { key: 'small', label: '紧凑' },
  { key: 'middle', label: '中号' },
  { key: 'large', label: '宽松' },
];

export function PlatformTableToolbar({
  title, extra, secondaryActions, primaryAction, showTitle = true, showRefresh = true, showDensity = true, showColumnSettings = true,
  refreshLoading = false, onRefresh, size = 'middle', onSizeChange, columnOptions = [],
  visibleColumnKeys, onVisibleColumnKeysChange,
}: PlatformTableToolbarProps) {
  const visible = new Set(visibleColumnKeys ?? columnOptions.map(column => column.key));
  const densityMenu: MenuProps = {
    selectable: true,
    selectedKeys: [size ?? 'middle'],
    items: densityOptions.map(option => ({ key: option.key, label: option.label })),
    onClick: ({ key }) => onSizeChange?.(key as PlatformTableDensity),
  };
  const columnMenu: MenuProps = {
    items: columnOptions.map(column => ({
      key: column.key,
      label: <Checkbox checked={visible.has(column.key)}>{column.label}</Checkbox>,
    })),
    onClick: ({ key, domEvent }) => {
      domEvent.stopPropagation();
      if (!onVisibleColumnKeysChange) return;
      const next = new Set(visible);
      if (next.has(String(key))) next.delete(String(key)); else next.add(String(key));
      onVisibleColumnKeysChange(columnOptions.filter(column => next.has(column.key)).map(column => column.key));
    },
  };
  const hasActions = showRefresh || showDensity || (showColumnSettings && columnOptions.length > 0);
  const hasBusinessActions = extra != null || secondaryActions != null || primaryAction != null;
  if (!showTitle && !hasActions && !hasBusinessActions) return null;
  return <div className="platform-table-toolbar">
    {showTitle && <Typography.Text className="platform-table-toolbar-title">{title}</Typography.Text>}
    {(hasActions || hasBusinessActions) && <Space className="platform-table-toolbar-actions" size={0}>
      {hasBusinessActions && <span className="platform-table-toolbar-business" style={{ marginInlineEnd: hasActions ? config.layout.buttonGap : 0 }}>
        {secondaryActions != null && <span className="platform-table-toolbar-secondary">{secondaryActions}</span>}
        {extra != null && <span className="platform-table-toolbar-extra">{extra}</span>}
        {primaryAction != null && <span className="platform-table-toolbar-primary">{primaryAction}</span>}
      </span>}
      {showRefresh && <Tooltip title="刷新">
        <Button type="text" aria-label="刷新表格" icon={<ReloadOutlined />} loading={refreshLoading} onClick={onRefresh} />
      </Tooltip>}
      {showDensity && <Dropdown menu={densityMenu} trigger={['click']}>
        <Tooltip title="密度"><Button type="text" aria-label="表格密度" icon={<ColumnHeightOutlined />} /></Tooltip>
      </Dropdown>}
      {showColumnSettings && columnOptions.length > 0 && <Dropdown menu={columnMenu} trigger={['click']}>
        <Tooltip title="列设置"><Button type="text" aria-label="列设置" icon={<SettingOutlined />} /></Tooltip>
      </Dropdown>}
    </Space>}
  </div>;
}
