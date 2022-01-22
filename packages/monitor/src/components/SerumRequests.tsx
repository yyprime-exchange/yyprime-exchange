import { Row } from 'antd';
import React from "react";
import styled from 'styled-components';

import { useSerumRequests } from '../utils/serum';
import FloatingElement from "./layout/FloatingElement";

const Title = styled.div`
  color: rgba(255, 255, 255, 1);
  padding: 0 0 20px 0;
`;

export default function SerumRequests() {
  const requests = useSerumRequests();
  return (
    <FloatingElement style={{ width: '400px', height: '150px' }} >
      <Title>Serum Requests</Title>
      {requests.slice(0, 2).map((request, index) => (
        <Row key={index}><pre>{JSON.stringify(request)}</pre></Row>
      ))}
    </FloatingElement>
  );
};
