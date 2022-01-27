import { Row } from 'antd';
import React from 'react';
import { useSolanaBots } from '../utils/solana';
import FloatingElement from './layout/FloatingElement';
import { Title } from './styles';

export default function Bots() {
  const bots = useSolanaBots();
  return (
    <FloatingElement style={{ width: '600px', height: '300px' }}>
      <Title>Bots</Title>
      {bots.slice(0, 8).map((bot, index) => (
        <Row key={index}>
          <pre>{JSON.stringify(bot)}</pre>
        </Row>
      ))}
    </FloatingElement>
  );
}
