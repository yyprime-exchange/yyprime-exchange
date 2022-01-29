import { Col, Row } from 'antd';
import React from 'react';
import styled from 'styled-components';

import { ConnectionProvider } from '../utils/connection';
//import { PythProvider } from '../utils/pyth'
import { PythConnectionProvider } from '../utils/pythConnection';

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
  /*
          <PythProvider>
            <PoolsPageInner />
          </PythProvider>
  */
  return (
    <>
      <ConnectionProvider>
        <PythConnectionProvider>
          <PoolsPageInner />
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
        </Row>
      </Wrapper>
    </>
  );
}
