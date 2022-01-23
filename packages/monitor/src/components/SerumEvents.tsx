import { Row } from 'antd';
import React from "react";
import styled from 'styled-components';

import { useSerumEvents } from '../utils/serum';
import FloatingElement from "./layout/FloatingElement";

const Title = styled.div`
  color: rgba(255, 255, 255, 1);
  padding: 0 0 20px 0;
`;

export default function SerumEvents() {
  const events = useSerumEvents();
  return (
    <FloatingElement style={{ width: '400px', height: '450px' }} >
      <Title>Serum Events</Title>
      {events.slice(0, 7).map((event, index) => (
        <Row key={index}><pre>{
          JSON.stringify(event).replace(/[\{,]*(false)|[:]( true,)|(:,)/g,"").replace(/[}{"]|( : )|(: )/g," ").replace(/[,]*(bid)/g,"").replace(":,","").replaceAll(":true,","").replaceAll("  "," ")
        } </pre></Row>
      ))}
    </FloatingElement>
  );
};
