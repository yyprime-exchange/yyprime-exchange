//import { Col, Row } from 'antd';
import React from "react";
import FloatingElement from "./layout/FloatingElement";
import { Title } from './styles';
import { InfoChart } from '../components/Chart'
export default function PriceChart() {
  return (
    <FloatingElement style={{ width: '600px' }}>
      <Title>Price Chart</Title>
      <InfoChart/>
    </FloatingElement>
  );
}
