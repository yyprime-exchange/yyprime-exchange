import { Col, Row } from "antd";
import React, { useContext } from "react";
import styled from "styled-components";

import Pools from "../components/Pools";
import { ConfigurationProvider } from "../utils/configuration";
import { ConnectionProvider } from "../utils/connection";
import { PythConnectionProvider } from "../utils/pythConnection";
import {
  PythPoolsContext,
  PythPoolsProvider,
  usePythPrices,
} from "../utils/pythPools";

const Wrapper = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 8px 8px;
  .borderNone .ant-select-selector {
    border: none !important;
  }
`;

export default function PoolsPage() {
  return (
    <>
      <ConfigurationProvider>
        <ConnectionProvider>
          <PythConnectionProvider>
            <PythPoolsProvider>
              <PoolsPageInner />
            </PythPoolsProvider>
          </PythConnectionProvider>
        </ConnectionProvider>
      </ConfigurationProvider>
    </>
  );
}

function PoolsPageInner() {
  const prices = usePythPrices();
  const [pricingState, dispatch] = useContext(PythPoolsContext);
  return (
    <>
      <Wrapper>
        <Row style={{ justifyContent: "center", marginTop: "35px" }}>
          <Col>
            <Pools pricingState={pricingState} />
          </Col>
        </Row>
      </Wrapper>
    </>
  );
}
