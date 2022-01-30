import { Col, Row } from 'antd';
import React from 'react';
import styled from 'styled-components';

import Pools from '../components/Pools';
import { ConnectionProvider } from '../utils/connection';
import { PythConnectionProvider } from '../utils/pythConnection';
import { PythPoolsProvider } from '../utils/pythPools'

const Wrapper = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 8px 8px;
  .borderNone .ant-select-selector {
    border: none !important;
  }
`;

export default function PoolsPage() {
  return (
    <>
      <ConnectionProvider>
        <PythConnectionProvider>
          <PythPoolsProvider>
            <PoolsPageInner />
          </PythPoolsProvider>
        </PythConnectionProvider>
      </ConnectionProvider>
    </>
  );
}

function PoolsPageInner() {
  return (
    <>
      <Wrapper>
        <Row>
          <Col>
            <Pools />
          </Col>
        </Row>
      </Wrapper>
    </>
  );
}
