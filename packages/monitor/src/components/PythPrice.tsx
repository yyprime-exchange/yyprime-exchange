import { Col, Row } from 'antd';
import React from "react";
import styled from 'styled-components';

import { usePythPrice } from "../utils/pyth";
import FloatingElement from "./layout/FloatingElement";

const Title = styled.div`
  color: rgba(255, 255, 255, 1);
  padding: 0 0 20px 0;
`;

export default function PythPrice() {
  const pythPrice = usePythPrice();
  return (
    <FloatingElement style={{ width: '300px', height: '120px' }} >
      <Title>Pyth Price</Title>
      <Row
      >
        <Col span={12} style={{ textAlign: 'left'}}>Price</Col>
        <Col span={12} style={{ textAlign: 'right' }}>{pythPrice.price?.toFixed(2)}</Col>
      </Row>
      <Row>
        <Col span={12} style={{ textAlign: 'left'}}>Confidence</Col>
        <Col span={12} style={{ textAlign: 'right' }}>{pythPrice.confidence?.toFixed(4)}</Col>
      </Row>
    </FloatingElement>
  );
};
