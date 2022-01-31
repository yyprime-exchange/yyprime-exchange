import { Button, Col, Row, Skeleton, TableProps } from "antd";
import React, { useEffect, useMemo, useState } from "react";
import FloatingElement from "./layout/FloatingElement";
import { Title } from "./styles";
import { usePythPrices } from "../utils/pythPools";
import { Table, Divider, Tag } from "antd";
import { ColumnType } from "antd/lib/table";
import Meta from "antd/lib/card/Meta";
import { Redirect } from "react-router-dom";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import CountUp, { useCountUp } from "react-countup";
import useNumberFormatter from "../hooks/useNumberFormatter";
import { useConfiguration } from "../utils/configuration";
import styled from "styled-components";

const _styledDiv = styled.div`
  padding: 20px;
  background: #e76e3c;
  margin-bottom: 10px;
  border-radius: 15px;
  font-weight: bolder;
  font-size: xx-large;
`;

const data = [
  {
    key: "GVXRSBjFk6e6J3NbVPXohDJetcTjaeeuykUpbQF8UoMU",
    name: "BTC/USDC",
    liquidity: 0,
  },
  {
    key: "JBu1AL4obBcCMqKBBxhpWCNUt136ijcuMZLFvTP7iWdB",
    name: "ETH/USDC",
    liquidity: 0,
  },
  {
    key: "H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG",
    name: "SOL/USDC",
    liquidity: 0,
  },
];

export default function Pools({ pricingState }) {
  const [poolsConfig, setPoolsConfig] = useState([]);
  const [liquidityData, setliquidityData] = useState(data);
  const [TVL, setTVL] = useState(0);

  const [isLoading, setIsLoading] = useState(true);

  const { update } = useCountUp({
    duration: 0.4,
    useEasing: true,
    separator: ",",
    decimal: "0",
    prefix: "TVL: $",
    ref: "countUpRef",
    start: 0,
    end: TVL,
  });

  const numberFormatter = useNumberFormatter("en-US", {
    style: "currency",
    currency: "USD",
  });

  const configuration = useConfiguration();
  const columns = [
    {
      title: "Pair Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Liquidity",
      dataIndex: "liquidity",
      key: "liquidity",
      render: (liquidity) => numberFormatter(liquidity),
      sorter: (a, b) => a.liquidity - b.liquidity,
    },
    {
      key: "action",
      render: (text, record) => (
        <span>
          <Button onClick={() => goToDashboard(record)}>
            <a>Provide Liquidity</a>
          </Button>
          <Divider type="vertical" />
          <Button onClick={() => goToDashboard(record)}>
            <a>View in Dashboard</a>
          </Button>
        </span>
      ),
    },
  ];

  useEffect(() => {
    const poolsConfig = configuration.pools.map((config) => {
      return {
        pythOracle: config.basePrice,
        name: config.symbol,
        baseBalance: config.baseBalance,
        quoteBalance: config.quoteBalance,
      };
    });
    setPoolsConfig(() => poolsConfig);
  }, []);

  const fetchPythPrices = async () => {
    setIsLoading(true);

    let tvl_agg = 0;
    liquidityData.forEach((row) => {
      if (pricingState.pricingMap.hasOwnProperty(row.key)) {
        const relevantToken = poolsConfig.find(
          (poolConfig) => poolConfig["pythOracle"] === row.key
        );
        if (relevantToken) {
          row.liquidity =
            relevantToken["baseBalance"] * pricingState.pricingMap[row.key] +
            relevantToken["quoteBalance"];
          tvl_agg += row.liquidity;
        }
      }
    });
    update(tvl_agg);
    setliquidityData(() => liquidityData);
    setIsLoading(false);
  };

  useEffect(() => {
    const interval = setInterval(fetchPythPrices, 1000);

    return () => clearInterval(interval);
  }, [poolsConfig]);

  const goToDashboard = (pair) => {
    return <Redirect exact to={`/#/market/${pair.base}/${pair.quote}`} />;
  };

  const getPairImage = () => {
    // return (<Image> </Image>)
  };

  return (
    <>
      <_styledDiv>
        <span id="countUpRef" />
      </_styledDiv>
      {/* <Skeleton loading={isLoading} active> */}
      <Table
        pagination={false}
        loading={isLoading}
        dataSource={data}
        columns={columns}
      />
      {/* </Skeleton> */}
    </>
  );
}
