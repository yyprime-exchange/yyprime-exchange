import { Layout } from 'antd';
import React, { useEffect } from 'react';
import TopBar from './TopBar';
import { CustomFooter as Footer } from './Footer';
import queryString from 'query-string';
import { useLocation } from 'react-router-dom';
const { Header, Content } = Layout;

export default function BasicLayout({ children }) {
  const { search } = useLocation();
  const parsed = queryString.parse(search);

  return (
    <React.Fragment>
      <Layout
        style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}
      >
        <Header style={{ padding: 0, minHeight: 64, height: 'unset' }}>
          <TopBar />
        </Header>
        <Content style={{ flex: 1 }}>{children}</Content>
        <Footer />
      </Layout>
    </React.Fragment>
  );
}
