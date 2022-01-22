import { Col, Row } from 'antd';
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import Bots from '../components/Bots';
import PythPrice from '../components/PythPrice';
import SerumEvents from '../components/SerumEvents'
import SerumRequests from '../components/SerumRequests'
import SerumOrderbook from '../components/SerumOrderbook';
import { ConnectionProvider } from '../utils/connection';
import { PythProvider } from '../utils/pyth'
import { SerumProvider } from '../utils/serum';

const Wrapper = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 8px 8px;
  .borderNone .ant-select-selector {
    border: none !important;
  }
`;

export default function SimulationPage() {
  const { baseSymbol, quoteSymbol } = useParams();
  useEffect(() => { if (baseSymbol) { localStorage.setItem('baseSymbol', JSON.stringify(baseSymbol)); } }, [baseSymbol]);
  useEffect(() => { if (quoteSymbol) { localStorage.setItem('quoteSymbol', JSON.stringify(quoteSymbol)); } }, [quoteSymbol]);
  return (
    <>
      <ConnectionProvider>
        <SerumProvider baseSymbol={baseSymbol} quoteSymbol={quoteSymbol} >
          <PythProvider baseSymbol={baseSymbol} >
            <MarketPageInner />
          </PythProvider>
        </SerumProvider>
      </ConnectionProvider>
    </>
  );
}

function MarketPageInner() {
  return (
    <>
      <Wrapper>
        <Row>
          <Col>
            <Wrapper>
              <Row>
                <Col>
                  <PythPrice />
                </Col>
              </Row>
              <Row>
                <Col style={{ height: '100%' }}>
                  <SerumOrderbook />
                </Col>
              </Row>
            </Wrapper>
          </Col>
          <Col>
            <Wrapper>
              <Row>
                <Col>
                  <SerumEvents />
                </Col>
              </Row>
              <Row>
                <Col style={{ height: '100%' }}>
                  <SerumRequests />
                </Col>
              </Row>
            </Wrapper>
          </Col>
          <Col>
            <Wrapper>
              <Row>
                <Col style={{ height: '100%' }}>
                  <Bots />
                </Col>
              </Row>
            </Wrapper>
          </Col>
        </Row>
      </Wrapper>
    </>
  );
}
