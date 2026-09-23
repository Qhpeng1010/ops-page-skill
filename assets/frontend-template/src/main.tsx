import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PlatformProvider } from './platform/PlatformProvider';
import { PlatformShell } from './platform/PlatformShell';
import { pages } from './pages';

createRoot(document.getElementById('root')!).render(
  <StrictMode><PlatformProvider><PlatformShell pages={pages} /></PlatformProvider></StrictMode>,
);
