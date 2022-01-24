import { Row } from 'antd';
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
        <Row key={index}><pre>{
          // take out anything false back to the next control char, take out the 'true', scrape all the control chars,
          JSON.stringify(event).replace(/[{,]*(false)|[:](true)|(:|,)/g,"").replace(/[}{"]|( : )|(: )/g," ").replace(/[,]*(bid)|(ask)/g,"").replace(":,","").replaceAll(":true,","").replaceAll("  "," ")
        } </pre></Row>
      ))}
    </FloatingElement>
  );
};
