import type { CSSProperties, ReactNode } from 'react';
import { Card, ConfigProvider, Descriptions, Divider, Space, Tabs, Typography, theme, type DescriptionsProps, type TabsProps } from 'antd';
import config from './platform.config.json';

export function PlatformModule({ title, description, extra, tabs, tabsMode = 'header', showDivider = true, hasTable = false, detail = false, children }: {
  title?: ReactNode;
  description?: ReactNode;
  extra?: ReactNode;
  tabs?: TabsProps;
  /** Use subtabs only when the user explicitly requests tabs below a title. */
  tabsMode?: 'header' | 'subtabs';
  /** Controls the title divider; hasTable always suppresses it for multi-module tables. */
  showDivider?: boolean;
  /** Multi-module Table content is flush with the module header and has no title divider. */
  hasTable?: boolean;
  /** Detail modules use separators between adjacent modules instead of a divider under each title. */
  detail?: boolean;
  children?: ReactNode;
}) {
  const { token } = theme.useToken();
  const hasChildren = children !== undefined && children !== null && children !== false;
  const hasTabs = Boolean(tabs?.items?.length);
  const showTitle = title != null && (!hasTabs || tabsMode === 'subtabs');
  const hasTabContent = tabs?.items?.some(item => item.children !== undefined && item.children !== null && item.children !== false);
  const hasContent = hasChildren || hasTabs;
  return <Card className={['platform-module', detail ? 'platform-module--detail' : undefined].filter(Boolean).join(' ')} variant="borderless"
    aria-label={typeof title === 'string' ? title : undefined}
    extra={hasTabs && !showTitle ? undefined : extra}
    classNames={{ header: hasContent ? 'platform-module-header' : undefined }}
    title={!showTitle ? undefined : <><div className="platform-module-title">
      <span className="platform-module-heading">
        <span className="platform-module-marker" style={{ background: token.colorPrimary }} aria-hidden="true" />
        {title}
      </span>
      {description && <Typography.Text type="secondary" className="platform-module-description">{description}</Typography.Text>}
    </div>{hasContent && showDivider && !hasTable && !detail && <Divider className="platform-module-divider" style={{ position: 'absolute',
      insetInline: config.layout.elementGap, bottom: 0, width: 'auto', minWidth: 0,
      height: 1, margin: 0, border: 0, background: config.layout.queryDividerColor }} />}</>}
    styles={{
      root: { boxShadow: 'none', background: token.colorBgContainer },
      header: { paddingInline: config.layout.elementGap, minHeight: 56, borderBottom: 0, position: 'relative' },
      title: { whiteSpace: 'normal', paddingBlock: config.layout.elementGap },
      body: { padding: config.layout.elementGap, paddingTop: hasTabs || hasTable ? 0 : config.layout.elementGap,
        ...(hasContent ? {} : { display: 'none' }) },
    }}>
    {hasTabs && <Tabs type="line" tabPlacement="top" size="middle" destroyOnHidden={false}
      tabBarExtraContent={showTitle ? undefined : extra}
      styles={{ header: { marginBottom: hasTabContent || hasChildren ? config.layout.elementGap : 0 } }}
      {...tabs} className={['platform-module-tabs', tabs?.className].filter(Boolean).join(' ')} />}
    {children}
  </Card>;
}

/** Detail defaults for multi-module pages; other Descriptions retain their own layout. */
export function PlatformModuleDescriptions({ column = 3, size = 'middle', rowGap = config.layout.moduleDetailRowGap,
  ...props }: DescriptionsProps & { rowGap?: number }) {
  return <ConfigProvider theme={{ components: {
    Descriptions: { itemPaddingBottom: rowGap, paddingSM: rowGap },
  } }}>
    <Descriptions column={column} size={size} {...props} />
  </ConfigProvider>;
}

/** Place Form.Item children here inside an Ant Form with layout="vertical". */
export function PlatformModuleFormGrid({ children, columns = 3 }: {
  children: ReactNode;
  columns?: number;
}) {
  return <div className="platform-module-form-grid" style={{
    '--ops-module-form-columns': Math.max(1, Math.floor(columns)),
    '--ops-element-gap': `${config.layout.elementGap}px`,
  } as CSSProperties}>{children}</div>;
}

/** Use for forms inside Modal or Drawer; fields keep a 16px row and column gap. */
export function PlatformOverlayFormGrid({ children, columns = 2 }: {
  children: ReactNode;
  columns?: number;
}) {
  return <div className="platform-overlay-form-grid" style={{
    '--ops-overlay-form-columns': Math.max(1, Math.floor(columns)),
    '--ops-element-gap': `${config.layout.elementGap}px`,
  } as CSSProperties}>{children}</div>;
}

/** Use once at the end of the page/form; secondary actions precede the primary action. */
export function PlatformPageFooter({ actions, secondaryActions, primaryAction, summary, visible = true }: {
  /** Escape hatch for a fully custom action order. */
  actions?: ReactNode;
  secondaryActions?: ReactNode;
  primaryAction?: ReactNode;
  summary?: ReactNode;
  visible?: boolean;
}) {
  const { token } = theme.useToken();
  if (!visible) return null;
  return <footer className="platform-page-footer" aria-label="页面操作" style={{
    background: token.colorBgContainer, borderTop: `1px solid ${token.colorBorderSecondary}`,
  }}>
    {summary && <div className="platform-page-footer-summary">{summary}</div>}
    <Space className="platform-page-footer-actions" size={config.layout.buttonGap} wrap>
      {actions ?? <>{secondaryActions}{primaryAction}</>}
    </Space>
  </footer>;
}
