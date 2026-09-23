import type { CSSProperties, PropsWithChildren } from 'react';
import { App, ConfigProvider, theme, type ThemeConfig } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import config from './platform.config.json';
import { ModalDividerDefaults } from './modalDividers';

const customTheme: ThemeConfig = config.theme;
const algorithms = [config.appearance === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm];
if (config.density === 'compact') algorithms.push(theme.compactAlgorithm);

export function PlatformProvider({ children }: PropsWithChildren) {
  return (
    <ConfigProvider locale={zhCN}
      componentSize={config.componentSize as 'small' | 'middle' | 'large'}
      space={{ size: config.layout.buttonGap }}
      drawer={{ styles: { root: {
        // Portaled drawers cannot inherit layout variables from PlatformShell.
        '--ops-element-gap': `${config.layout.elementGap}px`,
        '--ops-detail-divider': config.layout.queryDividerColor,
        '--ops-detail-title-gap': `${config.layout.detailTitleGap}px`,
      } as CSSProperties } }}
      theme={{ ...customTheme, algorithm: algorithms,
        token: { colorLink: customTheme.token?.colorPrimary, colorInfo: customTheme.token?.colorPrimary,
          ...customTheme.token }, components: {
        ...customTheme.components,
        Form: { itemMarginBottom: config.layout.elementGap, ...customTheme.components?.Form },
        Menu: { darkItemSelectedColor: customTheme.token?.colorPrimary,
          ...customTheme.components?.Menu, collapsedWidth: config.shell.collapsedWidth },
      } }}>
      <ModalDividerDefaults><App>{children}</App></ModalDividerDefaults>
    </ConfigProvider>
  );
}
