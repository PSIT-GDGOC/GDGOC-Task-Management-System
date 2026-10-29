import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppErrorBoundary } from './components/common/AppErrorBoundary';
import './index.css';
import './theme/theme.css';
import { ThemeProvider } from './theme/ThemeProvider';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AppErrorBoundary><ThemeProvider><App /></ThemeProvider></AppErrorBoundary>
  </React.StrictMode>
);
