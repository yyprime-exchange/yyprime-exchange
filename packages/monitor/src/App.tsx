import { Spin } from 'antd';
import React, { Suspense } from 'react';

import './App.less';
import ErrorBoundary from './components/ErrorBoundary';
import { GlobalStyle } from './global_style';
import { Routes } from './routes';
import { ConfigurationProvider } from './utils/configuration';

export default function App() {
  return (
    <Suspense fallback={() => <Spin size="large" />}>
      <GlobalStyle />
      <ErrorBoundary>
        <ConfigurationProvider>

          <Suspense fallback={() => <Spin size="large" />}>
            <Routes />
          </Suspense>

        </ConfigurationProvider>
      </ErrorBoundary>
    </Suspense>
  );
}
