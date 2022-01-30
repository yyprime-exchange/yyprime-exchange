import { Col, Row } from 'antd';
import React from 'react';
import { useSerumEvents } from '../utils/serum';
import FloatingElement from './layout/FloatingElement';
import { Title } from './styles';

export default function SerumEvents() {
  const events = useSerumEvents();
  return (
    <FloatingElement style={{  width: '400px', height: '608px' }} >
      <Title >Serum Events</Title>
        <Row style={{color: "#FF0000"}} >
          <Col span={3}><b>Type</b></Col>
          <Col span={3}><b>State</b></Col>
          <Col span={3}><b>Side</b></Col>
          <Col span={8}><b>QtyRel</b></Col>
          <Col span={7}><b>QtyPd</b></Col>
        </Row>
      {events.slice(0, 22).map((event, index) => (
        <Row key={index}>
          <Col span={3}>{event.eventFlags.maker ? 'Maker' : 'Taker'}</Col>
          <Col span={3}>{event.eventFlags.fill ? 'Fill' : 'Out'}</Col>
          <Col span={3}>{event.eventFlags.bid ? 'Bid' : 'Ask'}</Col>
          <Col span={8}>{event.nativeQuantityReleased.toNumber()}</Col>
          <Col span={7}>{event.nativeQuantityPaid.toNumber() }</Col>
        </Row>
      ))}
    </FloatingElement>
  );
};
