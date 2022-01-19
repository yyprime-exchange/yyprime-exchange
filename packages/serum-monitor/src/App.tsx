import React, { Suspense } from 'react';
import './App.less';
import { ConnectionProvider } from './utils/connection';
import { GlobalStyle } from './global_style';
import { Spin } from 'antd';
import ErrorBoundary from './components/ErrorBoundary';
import { Routes } from './routes';
import PythProvider from './contexts/pyth';

export default function App() {
  return (
    <Suspense fallback={() => <Spin size="large" />}>
      <GlobalStyle />
      <ErrorBoundary>   
        <ConnectionProvider>
        <PythProvider >
          <Suspense fallback={() => <Spin size="large" />}>
            <Routes />
          </Suspense>
          </PythProvider>
        </ConnectionProvider>
      </ErrorBoundary>
    </Suspense>
  );
}
