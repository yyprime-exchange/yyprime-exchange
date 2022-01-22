//import { Col, Row } from 'antd';
import React from "react";
import styled from 'styled-components';

import FloatingElement from "./layout/FloatingElement";

const Title = styled.div`
  color: rgba(255, 255, 255, 1);
  padding: 0 0 20px 0;
`;

export default function SerumRequests() {
  return (
    <FloatingElement style={{ width: '400px', height: '300px' }} >
      <Title>Serum Requests</Title>


    </FloatingElement>
  );
};
