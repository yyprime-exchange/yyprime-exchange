import { Col, Row } from 'antd';
import React from 'react';
import { useSerumEvents } from '../utils/serum';
import FloatingElement from './layout/FloatingElement';
import { Title } from './styles';

export default function SerumEvents() {
  const events = useSerumEvents();
  return (
    <FloatingElement style={{ width: '400px', height: '450px' }} >
      <Title>Serum Events</Title>
      {events.slice(0, 7).map((event, index) => (
        <Row key={index}>
          <Col>{event.eventFlags.fill ? 'Fill' : 'Out'}</Col>
          <Col>{event.eventFlags.bid ? 'Bid' : 'Ask'}</Col>
          <Col>{event.eventFlags.maker ? 'Maker' : 'Taker'}</Col>
        </Row>
      ))}
    </FloatingElement>
  );
};
