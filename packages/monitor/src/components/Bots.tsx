import { Row } from 'antd';
import React from "react";
import styled from 'styled-components';

import { useSolanaBots } from "../utils/solana";
import FloatingElement from "./layout/FloatingElement";

const Title = styled.div`
  color: rgba(255, 255, 255, 1);
  padding: 0 0 20px 0;
`;

export default function Bots() {
  const bots = useSolanaBots();
  return (
    <FloatingElement style={{ width: '600px', height: '300px' }} >
      <Title>Bots</Title>
      {bots.slice(0, 8).map((bot, index) => (
        <Row key={index}><pre>{JSON.stringify(bot)}</pre></Row>
      ))}
    </FloatingElement>
  );
};
