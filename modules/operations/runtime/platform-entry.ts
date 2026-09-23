// Maintenance entry only. Both page modes use these exact platform components.
import 'antd/dist/reset.css';
import React from 'react';
import { DownOutlined } from '@ant-design/icons';
export { React };
export { DownOutlined };
export { createRoot } from 'react-dom/client';
export { App, Badge, Button, DatePicker, Divider, Drawer, Dropdown, Empty, Form, Input, InputNumber, Modal, Select, Space, Tag, Typography } from 'antd';
export { PlatformProvider } from '../shell/PlatformProvider';
export { PlatformShell } from '../shell/PlatformShell';
export { PlatformQueryForm } from '../shell/PlatformQueryForm';
export { PlatformTable } from '../shell/PlatformTable';
export { PlatformTableToolbar } from '../shell/PlatformTableToolbar';
export { PlatformModuleDescriptions, PlatformOverlayFormGrid } from '../shell/PlatformModule';
export { withModalDividers } from '../shell/modalDividers';
