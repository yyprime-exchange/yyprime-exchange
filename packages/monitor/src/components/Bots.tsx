import { Col, Row } from 'antd';
import React from 'react';
import { useSolanaBots } from "../utils/solana";
import FloatingElement from './layout/FloatingElement';
import { Title } from './styles';

export default function Bots() {
  const bots = useSolanaBots();
  return (
    <FloatingElement style={{ width: '600px', height: '200px' }} >
      <Title>Bots</Title>
      {bots.slice(0, 8).map((bot, index) => (
        <Row key={index}>
          <Col span={4}>{bot.name}</Col>
          <Col span={4}>{bot.type}</Col>
          <Col span={6}>{bot.baseTokens.toFixed(2)} {bot.baseSymbol}</Col>
          <Col span={6}>{bot.quoteTokens.toFixed(2)} {bot.quoteSymbol}</Col>
        </Row>
      ))}
    </FloatingElement>
  );
};
