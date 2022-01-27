//import { Col, Row } from 'antd';
import React from 'react';
import FloatingElement from './layout/FloatingElement';
import { Title } from './styles';

export default function PriceChart() {
  return (
    <FloatingElement style={{ width: '600px', height: '300px' }}>
      <Title>Price Chart</Title>
    </FloatingElement>
  );
}
