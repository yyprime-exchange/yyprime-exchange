import { Col, Row } from 'antd';
import React from 'react';
import FloatingElement from './layout/FloatingElement';
import { Title } from './styles';
import { usePythPrices } from '../utils/pythPools';

export default function Pools() {
  const pythPrices = usePythPrices() //TODO change this to handle all prices.
  return (
    <FloatingElement style={{ width: '800px', height: '600px' }}>
      <Title>Pools</Title>
      <Row>
      </Row>
    </FloatingElement>
  );
}
