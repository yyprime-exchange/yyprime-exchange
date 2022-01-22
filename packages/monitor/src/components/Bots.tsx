//import { Col, Row } from 'antd';
import React from "react";
import styled from 'styled-components';

import FloatingElement from "./layout/FloatingElement";

const Title = styled.div`
  color: rgba(255, 255, 255, 1);
  padding: 0 0 20px 0;
`;

export default function Bots() {
  return (
    <FloatingElement style={{ width: '600px', height: '610px' }} >
      <Title>Bots</Title>


    </FloatingElement>
  );
};
