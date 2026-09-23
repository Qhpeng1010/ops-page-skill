import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { App, Breadcrumb, Button, ConfigProvider, Divider, Drawer, Dropdown, Grid, Input, Menu, Modal, Space, Tabs, Tooltip, Typography, theme, type MenuProps } from 'antd';
import { AppstoreFilled, DownOutlined, FullscreenExitOutlined, FullscreenOutlined, RightOutlined, MenuFoldOutlined, MenuUnfoldOutlined, SearchOutlined, UserOutlined } from '@ant-design/icons';
import config from './platform.config.json';
import './shell.css';

const expandedLogo = new URL('./logo-expanded.svg', import.meta.url).href;
const collapsedLogo = new URL('./logo-collapsed.svg', import.meta.url).href;

export type PageContext = { openPage: (key: string) => void };
export type PlatformPage = {
  key: string;
  title: string;
  group: string;
  projectKeys?: string[];
  icon?: ReactNode;
  layout?: 'plain' | 'single-module' | 'multi-module';
  showInMenu?: boolean;
  render: (context: PageContext) => ReactNode;
  canClose?: () => boolean | Promise<boolean>;
};
type Session = { keys: string[]; active: string };
type Project = { key: string; name: string; pages: PlatformPage[] };
type Navigation = { projectKey: string; session: Session };

function readSaved<T>(key: string): Partial<T> {
  try { return JSON.parse(sessionStorage.getItem(key) || '{}') ?? {}; } catch { return {}; }
}

function restore(project: Project, storageRoot: string, preferredKey?: string): Session {
  const valid = new Set(project.pages.map(page => page.key));
  const saved = readSaved<Session>(`${storageRoot}:${project.key}`);
  const keys = Array.isArray(saved.keys) ? [...new Set(saved.keys.filter(key => valid.has(key)))] : [];
  const active = preferredKey && valid.has(preferredKey) ? preferredKey
    : typeof saved.active === 'string' && valid.has(saved.active) ? saved.active : project.pages[0].key;
  if (!keys.includes(active)) keys.push(active);
  return { keys, active };
}

function routeFromHash(projects: Project[]) {
  try {
    const parts = window.location.hash.slice(1).replace(/^\/+/, '').split('/').filter(Boolean).map(decodeURIComponent);
    const pageKey = parts.length === 1 ? parts[0] : parts[1];
    const project = projects.find(item => (parts.length === 1 || item.key === parts[0])
      && item.pages.some(page => page.key === pageKey));
    return project ? { project, pageKey } : undefined;
  } catch { return undefined; }
}

function routeHash(navigation: Navigation) {
  return `#${encodeURIComponent(navigation.projectKey)}/${encodeURIComponent(navigation.session.active)}`;
}

function PlatformNavigation({ pages, activeKey, collapsed, onSelect }: {
  pages: PlatformPage[]; activeKey: string; collapsed: boolean; onSelect: (key: string) => void;
}) {
  const currentGroup = `group:${pages.find(page => page.key === activeKey)!.group}`;
  const [openGroup, setOpenGroup] = useState<string | undefined>(() => collapsed ? undefined : currentGroup);
  useEffect(() => { setOpenGroup(collapsed ? undefined : currentGroup); }, [activeKey, currentGroup, collapsed]);
  const menuPages = pages.filter(page => page.showInMenu !== false);
  const groups = [...new Set(menuPages.map(page => page.group))];
  const items: MenuProps['items'] = groups.map(group => ({
    key: `group:${group}`, label: group, icon: <AppstoreFilled />, className: 'platform-navigation-group',
    children: menuPages.filter(page => page.group === group).map(page => ({
      key: page.key, label: page.title, className: 'platform-navigation-page',
    })),
  }));
  const navigationStyle = {
    '--ops-menu-hover-bg': config.theme.components.Menu.darkItemHoverBg,
    '--ops-menu-parent-color': config.theme.components.Menu.darkItemColor,
  } as CSSProperties;
  return <Menu theme="dark" mode="inline" inlineCollapsed={collapsed}
    classNames={{ root: 'platform-navigation', popup: { root: 'platform-navigation' } }}
    styles={{ root: navigationStyle,
      itemContent: { fontWeight: 400 }, subMenu: { itemContent: { fontWeight: 400 } },
      popup: { root: navigationStyle } }}
    items={items} selectedKeys={[activeKey]} openKeys={openGroup ? [openGroup] : []}
    onOpenChange={keys => setOpenGroup(keys.find(key => key !== openGroup) ?? keys[0])}
    onClick={({ key }) => onSelect(key)} />;
}

export function PlatformShell({ pages: allPages, tools }: { pages: PlatformPage[]; tools?: ReactNode }) {
  if (!allPages.length || new Set(allPages.map(page => page.key)).size !== allPages.length) {
    throw new Error('PlatformShell requires nonempty pages with unique keys.');
  }
  const projects = useMemo(() => config.projects.map(project => ({ ...project,
    pages: allPages.filter(page => !page.projectKeys || page.projectKeys.includes(project.key)),
  })).filter(project => project.pages.length), [allPages]);
  if (!projects.length) throw new Error('PlatformShell requires at least one project with registered pages.');
  const { token } = theme.useToken();
  const { message } = App.useApp();
  const screens = Grid.useBreakpoint();
  const mobile = screens.md === false;
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileSection, setProfileSection] = useState<'profile' | 'preferences'>();
  const [fullscreen, setFullscreen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const busy = useRef(false);
  const scrollNewPageToTop = useRef(false);
  const storageRoot = `ops-shell:${window.location.pathname}`;
  const [navigation, setNavigation] = useState<Navigation>(() => {
    const route = routeFromHash(projects);
    const saved = readSaved<{ projectKey: string }>(storageRoot);
    const project = route?.project ?? projects.find(item => item.key === saved.projectKey) ?? projects[0];
    return { projectKey: project.key, session: restore(project, storageRoot, route?.pageKey) };
  });
  const navigationRef = useRef(navigation);
  const project = projects.find(item => item.key === navigation.projectKey)!;
  const pages = project.pages;
  const session = navigation.session;
  const current = pages.find(page => page.key === session.active)!;

  const commit = useCallback((next: Navigation, replace = false) => {
    navigationRef.current = next;
    setNavigation(next);
    try {
      sessionStorage.setItem(storageRoot, JSON.stringify({ projectKey: next.projectKey }));
      sessionStorage.setItem(`${storageRoot}:${next.projectKey}`, JSON.stringify(next.session));
    } catch { /* Navigation still works without persistence. */ }
    const hash = routeHash(next);
    if (window.location.hash !== hash) window.history[replace ? 'replaceState' : 'pushState'](null, '', hash);
  }, [storageRoot]);

  const navigate = useCallback(async (target: Project, pageKey?: string, fromHistory = false) => {
    if (busy.current) {
      if (fromHistory) window.history.replaceState(null, '', routeHash(navigationRef.current));
      return;
    }
    const previous = navigationRef.current;
    const changedProject = target.key !== previous.projectKey;
    busy.current = true;
    if (changedProject) setSwitching(true);
    try {
      if (changedProject) {
        const previousPages = projects.find(item => item.key === previous.projectKey)!.pages;
        for (const key of previous.session.keys) {
          const page = previousPages.find(item => item.key === key);
          if (page?.canClose && !await page.canClose()) {
            if (fromHistory) window.history.replaceState(null, '', routeHash(previous));
            return;
          }
        }
      }
      const nextSession = changedProject ? restore(target, storageRoot, pageKey) : previous.session;
      const active = pageKey && target.pages.some(page => page.key === pageKey) ? pageKey : nextSession.active;
      scrollNewPageToTop.current = !nextSession.keys.includes(active);
      commit({ projectKey: target.key, session: {
        keys: nextSession.keys.includes(active) ? nextSession.keys : [...nextSession.keys, active], active,
      } }, fromHistory);
      setMobileOpen(false);
      setProjectOpen(false);
    } catch {
      void message.error('切换失败，请重试');
      if (fromHistory) window.history.replaceState(null, '', routeHash(previous));
    } finally {
      busy.current = false;
      setSwitching(false);
    }
  }, [commit, message, projects, storageRoot]);

  function openPage(key: string) { void navigate(project, key); }

  async function closePage(key: string) {
    if (busy.current || session.keys.length <= 1) return;
    busy.current = true;
    try {
      const page = pages.find(item => item.key === key);
      if (page?.canClose && !await page.canClose()) return;
      const index = session.keys.indexOf(key);
      if (index < 0) return;
      const keys = session.keys.filter(item => item !== key);
      commit({ projectKey: project.key, session: { keys,
        active: session.active === key ? keys[Math.max(0, index - 1)] : session.active,
      } }, true);
    } catch { void message.error('关闭失败，请重试'); }
    finally { busy.current = false; }
  }

  useEffect(() => { commit(navigationRef.current, true); }, [commit]);
  useEffect(() => {
    if (scrollNewPageToTop.current) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      scrollNewPageToTop.current = false;
    }
  }, [session.active]);
  useEffect(() => {
    const handleHash = () => {
      const route = routeFromHash(projects);
      if (route) void navigate(route.project, route.pageKey, true);
      else window.history.replaceState(null, '', routeHash(navigationRef.current));
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [navigate, projects]);

  useEffect(() => {
    const handleFullscreen = () => setFullscreen(document.fullscreenElement === document.documentElement);
    document.addEventListener('fullscreenchange', handleFullscreen);
    return () => document.removeEventListener('fullscreenchange', handleFullscreen);
  }, []);

  const searchablePages = projects.flatMap(item => item.pages
    .filter(page => page.showInMenu !== false)
    .map(page => ({ page, project: item })));
  const filteredPages = searchablePages.filter(({ page, project: item }) => {
    const query = searchQuery.trim().toLocaleLowerCase();
    return !query || `${page.title} ${page.group} ${item.name}`.toLocaleLowerCase().includes(query);
  }).slice(0, 8);
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
      else throw new Error('unsupported');
    } catch { void message.info('当前环境不支持全屏'); }
  };
  const openSearchResult = (projectTarget: Project, pageKey: string) => {
    setSearchOpen(false); setSearchQuery(''); void navigate(projectTarget, pageKey);
  };
  const profileItems: MenuProps['items'] = [
    { key: 'profile', label: '个人资料' },
    { key: 'preferences', label: '偏好设置' },
  ];
  const headerTools = <div className="platform-header-tools">
    <Tooltip title="搜索">
      <Button type="text" className="platform-header-tool" aria-label="搜索" icon={<SearchOutlined />} onClick={() => setSearchOpen(true)} />
    </Tooltip>
    <Tooltip title={fullscreen ? '退出全屏' : '全屏'}>
      <Button type="text" className="platform-header-tool" aria-label={fullscreen ? '退出全屏' : '全屏'}
        icon={fullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />} onClick={() => void toggleFullscreen()} />
    </Tooltip>
    <Dropdown menu={{ items: profileItems, onClick: ({ key }) => setProfileSection(key as 'profile' | 'preferences') }} trigger={['click']}>
      <Button type="text" className="platform-user-switch" aria-label="个人中心" aria-haspopup="menu">
        <UserOutlined /><span>{config.shell.userName}</span><DownOutlined />
      </Button>
    </Dropdown>
  </div>;

  const menu = (inlineCollapsed: boolean) => <PlatformNavigation key={`${project.key}:${inlineCollapsed}`}
    pages={pages} activeKey={current.key} collapsed={inlineCollapsed} onSelect={openPage} />;
  const projectSwitcher = (onDark = false) => <Tooltip title={projectOpen ? undefined : project.name}>
    <Button type="text" className="platform-project-switch" style={{ color: onDark ? '#ffffff' : token.colorText, fontWeight: 400 }}
      aria-label={`切换项目，当前：${project.name}`} aria-expanded={projectOpen}
      aria-controls="platform-project-panel" aria-haspopup="dialog" loading={switching}
      onClick={() => { setMobileOpen(false); setProjectOpen(value => !value); }}>
      <span className="platform-project-name" style={{ color: 'inherit' }}>{project.name}</span><RightOutlined style={{ color: 'inherit' }} />
    </Button>
  </Tooltip>;
  const brand = (compact = false) => <div className={`platform-brand${compact ? ' is-collapsed' : ''}`}>
    <img src={compact ? config.brand.collapsedLogoUrl || collapsedLogo : config.brand.logoUrl || expandedLogo}
      alt={config.brand.name} />
    {!compact && <><Divider orientation="vertical" className="platform-brand-divider" />{projectSwitcher(true)}</>}
  </div>;
  const sideWidth = mobile ? 0 : collapsed ? config.shell.collapsedWidth : config.shell.sidebarWidth;
  const pageClass = (page: PlatformPage) => `platform-page platform-page--${page.layout ?? 'plain'}`;
  const styles = {
    '--ops-sidebar-width': `${sideWidth}px`,
    '--ops-header-height': `${config.shell.headerHeight}px`,
    '--ops-tabs-height': `${config.shell.showTabs ? config.shell.tabsHeight : 0}px`,
    '--ops-new-tab-bg': config.layout.newTabBackground,
    '--ops-new-tab-padding': `${config.layout.newTabPadding}px`,
    '--ops-new-tab-module-gap': `${config.layout.newTabModuleGap}px`,
    '--ops-content-padding': `${mobile ? token.padding : config.shell.contentPadding}px`,
    '--ops-element-gap': `${config.layout.elementGap}px`,
    '--ops-button-gap': `${config.layout.buttonGap}px`,
    '--ops-table-toolbar-gap': `${config.layout.tableToolbarGap}px`,
    '--ops-detail-title-gap': `${config.layout.detailTitleGap}px`,
    '--ops-font-weight': `${config.theme.token?.fontWeight ?? 400}`,
    '--ops-strong-font-weight': `${config.theme.token?.fontWeightStrong ?? 500}`,
    '--ops-detail-divider': config.layout.queryDividerColor,
    '--ops-logo-height': `${config.brand.logoHeight}px`,
    '--ops-brand-divider-height': `${config.brand.dividerHeight}px`,
    '--ops-bg': token.colorBgContainer,
    '--ops-border': token.colorBorderSecondary,
    '--ops-sidebar-bg': config.shell.sidebarBackground,
    '--ops-brand-bg': config.shell.brandBackground,
    '--ops-brand-color': config.shell.brandColor,
    '--ops-tab-active-bg': token.colorPrimary,
    '--ops-tab-active-color': token.colorTextLightSolid,
    '--ops-tab-close-color': token.colorTextTertiary,
    '--ops-tab-bg': token.colorBgContainer,
    '--ops-tab-color': token.colorTextSecondary,
    '--ops-tab-border': token.colorBorder,
    '--ops-tab-hover': token.colorPrimaryHover,
    '--ops-tab-dot-size': `${config.shell.tabsDotSize}px`,
  } as CSSProperties;

  return <div className="platform-shell" style={styles}>
    {!mobile && <aside className="platform-sidebar" aria-label="主导航">
      {brand(collapsed)}
      {menu(collapsed)}
    </aside>}
    <div className="platform-workspace">
      <header className="platform-header">
        <Tooltip title={mobile ? '打开菜单' : collapsed ? '展开菜单' : '收起菜单'}>
          <Button type="text" aria-label={mobile ? '打开菜单' : collapsed ? '展开菜单' : '收起菜单'}
            icon={collapsed || mobile ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => mobile ? setMobileOpen(true) : setCollapsed(value => !value)} />
        </Tooltip>
        {(collapsed || mobile) && <div className="platform-header-project">{projectSwitcher()}</div>}
        <Breadcrumb className="platform-breadcrumb"
          styles={{ root: { fontWeight: 400 }, item: { fontWeight: 400 }, separator: { fontWeight: 400 } }}
          items={[{ title: current.group }, { title: current.title }]} />
        <div className="platform-tools">{headerTools}{tools}</div>
      </header>
      <main className="platform-main" key={project.key}>
        {config.shell.showTabs ? <Tabs type="editable-card" hideAdd activeKey={session.active}
          classNames={{ root: 'platform-tabs', item: 'platform-tab-item' }}
          styles={{
            header: { height: config.shell.tabsHeight, margin: 0, paddingInline: token.paddingXS,
              position: 'sticky', top: config.shell.headerHeight, zIndex: 99, background: token.colorBgContainer,
              borderBottom: `${token.lineWidth}px solid ${token.colorBorderSecondary}` },
            item: { height: config.shell.tabsHeight - token.paddingXXS * 2, paddingBlock: 0,
              paddingInline: token.paddingXS, alignSelf: 'center', borderRadius: config.shell.tabsBorderRadius,
              marginInlineStart: 0, marginInlineEnd: config.shell.tabsGap,
              fontSize: config.shell.tabsFontSize, fontWeight: 400 },
            remove: { color: 'var(--ops-tab-close-color)', marginInlineStart: 0,
              fontSize: config.shell.tabsFontSize * config.shell.tabsCloseIconScale },
          }}
          onChange={openPage} onEdit={(key, action) => { if (action === 'remove') void closePage(String(key)); }}
          items={session.keys.map(key => {
            const page = pages.find(item => item.key === key)!;
            return { key, label: <span className="platform-tab-label">
              {key === session.active && <span className="platform-tab-dot" aria-hidden="true" />}{page.title}
            </span>, closable: session.keys.length > 1, forceRender: true,
              children: <section className={pageClass(page)} aria-label={page.title}>{page.render({ openPage })}</section> };
          })} />
          : session.keys.map(key => {
            const page = pages.find(item => item.key === key)!;
            return <section key={key} className={pageClass(page)} hidden={key !== session.active} aria-label={page.title}>{page.render({ openPage })}</section>;
          })}
      </main>
    </div>
    <Modal title={profileSection === 'profile' ? '个人资料' : '偏好设置'} open={!!profileSection}
      footer={null} onCancel={() => setProfileSection(undefined)} width={400}>
      {profileSection === 'profile' ? <Space orientation="vertical" size={config.layout.elementGap}>
        <Typography.Text strong>{config.shell.userName}</Typography.Text>
        <Typography.Text type="secondary">运营管理平台用户</Typography.Text>
      </Space> : <Typography.Text type="secondary">当前使用平台默认偏好设置。</Typography.Text>}
    </Modal>
    <Modal title="搜索页面" open={searchOpen} footer={null} onCancel={() => { setSearchOpen(false); setSearchQuery(''); }} width={480}
      afterOpenChange={open => { if (!open) setSearchQuery(''); }}>
      <Space orientation="vertical" size={config.layout.elementGap} style={{ width: '100%' }}>
        <Input autoFocus allowClear prefix={<SearchOutlined />} placeholder="搜索页面名称或分组" value={searchQuery}
          onChange={event => setSearchQuery(event.target.value)}
          onPressEnter={() => { const first = filteredPages[0]; if (first) openSearchResult(first.project, first.page.key); }} />
        <Menu selectable={false} items={filteredPages.map(({ page, project: item }) => ({
          key: `${item.key}/${page.key}`, label: <Space orientation="vertical" size={0}>
            <span>{page.title}</span><Typography.Text type="secondary" style={{ fontSize: 12 }}>{item.name} / {page.group}</Typography.Text>
          </Space>,
        }))} onClick={({ key }) => { const [projectKey, pageKey] = String(key).split('/'); const target = projects.find(item => item.key === projectKey); if (target) openSearchResult(target, pageKey); }} />
        {!filteredPages.length && <Typography.Text type="secondary">没有找到匹配页面</Typography.Text>}
      </Space>
    </Modal>
    <Drawer title={config.brand.name} placement="left" closable={{ placement: 'end' }} open={mobileOpen} onClose={() => setMobileOpen(false)}
      styles={{ body: { padding: 0, background: config.shell.sidebarBackground } }}>
      <div style={styles}>{brand()}{menu(false)}</div>
    </Drawer>
    <Drawer title="切换项目" placement="left" closable={{ placement: 'end' }} open={projectOpen} onClose={() => setProjectOpen(false)}
      size={config.shell.projectPanelWidth} push={false} destroyOnHidden
      rootClassName="platform-project-drawer" rootStyle={{ left: sideWidth, overflow: 'hidden' }}
      styles={{
        mask: { background: 'transparent' },
        wrapper: { maxWidth: '100%', height: `${config.shell.projectPanelHeightPercent}dvh`, bottom: 'auto' },
        section: { background: config.shell.projectPanelBackground, color: token.colorTextLightSolid,
          fontSize: config.shell.projectPanelFontSize,
          borderInlineStart: `1px solid ${token.colorTextLightSolid}`, borderRadius: 0 },
        header: { height: config.shell.headerHeight, flex: 'none', padding: '0 12px', borderBottom: '1px solid rgb(255 255 255 / 16%)' },
        close: { color: 'inherit' },
        title: { fontSize: config.shell.projectPanelFontSize, fontWeight: 400 },
        body: { padding: '8px 0' },
      }}>
      <div id="platform-project-panel" aria-busy={switching}>
        <ConfigProvider theme={{ components: { Menu: {
          darkItemBg: 'transparent', darkItemSelectedBg: 'transparent',
          darkItemColor: token.colorTextLightSolid, darkItemSelectedColor: token.colorTextLightSolid,
          darkItemHoverBg: 'rgb(255 255 255 / 8%)',
        } } }}>
          <Menu theme="dark" mode="inline" inlineIndent={12} selectable selectedKeys={[project.key]} aria-label="项目列表"
            styles={{ item: { textAlign: 'center', paddingInline: 12, fontSize: config.shell.projectPanelFontSize },
              itemContent: { fontWeight: 400 } }}
            items={projects.map(item => ({ key: item.key, disabled: switching,
              label: <span className={item.key === project.key ? 'platform-project-option is-current' : 'platform-project-option'}>{item.name}</span>,
            }))}
            onClick={({ key }) => { const target = projects.find(item => item.key === key); if (target) void navigate(target); }} />
        </ConfigProvider>
      </div>
    </Drawer>
  </div>;
}
