import type { CSSProperties, PropsWithChildren } from 'react';
import { ExclamationCircleFilled } from '@ant-design/icons';
import { ConfigProvider, theme, type ModalFuncProps } from 'antd';
import config from './platform.config.json';

export function ModalDividerDefaults({ children }: PropsWithChildren) {
  const { token } = theme.useToken();
  const sectionGap = config.layout.modalDividerGap * 2 + 1;
  return <ConfigProvider modal={{
    classNames: { header: 'platform-modal-header', footer: 'platform-modal-footer' },
    styles: {
      container: {
        '--ops-element-gap': `${config.layout.elementGap}px`,
        '--ops-detail-divider': config.layout.queryDividerColor,
        '--ops-modal-divider-color': config.layout.modalDividerColor,
        '--ops-modal-header-gap': `${sectionGap}px`,
        '--ops-modal-footer-gap': `${sectionGap}px`,
        '--ops-modal-native-header-gap': `${token.marginXS}px`,
        '--ops-modal-native-footer-gap': `${token.marginSM}px`,
      } as CSSProperties,
      header: { marginBottom: sectionGap },
      footer: { marginTop: sectionGap },
    },
  }}>{children}</ConfigProvider>;
}

// Ant's method dialogs render their visible title/footer inside the body.
// Give every business confirmation the same warning Modal treatment.
export function withModalDividers(options: ModalFuncProps): ModalFuncProps {
  const { title, footer, type, icon } = options;
  return {
    ...options,
    type: type ?? 'warning',
    icon: icon ?? <ExclamationCircleFilled />,
    title: title === undefined || title === null || title === false || title === '' ? title
      : <span className="platform-modal-header platform-modal-method-title">{title}</span>,
    footer: footer === null || footer === false || footer === '' ? footer
      : (origin, extra) => <div className="platform-modal-footer platform-modal-method-footer">
        {typeof footer === 'function' ? footer(origin, extra) : footer ?? origin}
      </div>,
  };
}
