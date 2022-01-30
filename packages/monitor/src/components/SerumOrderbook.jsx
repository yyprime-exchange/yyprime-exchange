import assert from 'assert';
import BN from 'bn.js';
import { Col, Row } from 'antd';
import React, { useRef, useEffect, useState } from 'react';
import styled, { css } from 'styled-components';

import { useSerum, useSerumOrderbook } from '../utils/serum';
import { useInterval } from '../utils/useInterval';
import FloatingElement from './layout/FloatingElement';
import { Title } from './styles';

const SizeTitle = styled(Row)`
  padding: 0px 0 8px;
  color: #367ecd;
`;

const Line = styled.div`
  text-align: right;
  float: right;
  height: 100%;
  ${(props) =>
    props['data-width'] &&
    css`
      width: ${props['data-width']};
    `}
  ${(props) =>
    props['data-bgcolor'] &&
    css`
      background-color: ${props['data-bgcolor']};
    `}
`;

const Price = styled.div`
  position: absolute;
  right: 5px;
  color: white;
`;

export default function SerumOrderbook({ depth = 7 }) {

  const { baseSymbol, quoteSymbol } = useSerum();

  const [orderbook] = useSerumOrderbook(depth);

  const currentOrderbookData = useRef(null);
  const lastOrderbookData = useRef(null);

  const [orderbookData, setOrderbookData] = useState(null);

  useInterval(() => {
    if (
      !currentOrderbookData.current ||
      JSON.stringify(currentOrderbookData.current) !==
        JSON.stringify(lastOrderbookData.current)
    ) {
      let bids = orderbook?.bids || [];
      let asks = orderbook?.asks || [];

      let sum = (total, [, size], index) =>
        index < depth ? total + size : total;
      let totalSize = bids.reduce(sum, 0) + asks.reduce(sum, 0);

      let bidsToDisplay = getCumulativeOrderbookSide(bids, totalSize, false);
      let asksToDisplay = getCumulativeOrderbookSide(asks, totalSize, true);

      currentOrderbookData.current = {
        bids: orderbook?.bids,
        asks: orderbook?.asks,
      };

      setOrderbookData({ bids: bidsToDisplay, asks: asksToDisplay });
    }
  }, 250);

  useEffect(() => {
    lastOrderbookData.current = {
      bids: orderbook?.bids,
      asks: orderbook?.asks,
    };
  }, [orderbook]);

  function getCumulativeOrderbookSide(orders, totalSize, backwards = false) {
    let cumulative = orders
      .slice(0, depth)
      .reduce((cumulative, [price, size], i) => {
        const cumulativeSize = (cumulative[i - 1]?.cumulativeSize || 0) + size;
        cumulative.push({
          price,
          size,
          cumulativeSize,
          sizePercent: Math.round((cumulativeSize / (totalSize || 1)) * 100),
        });
        return cumulative;
      }, []);
    if (backwards) {
      cumulative = cumulative.reverse();
    }
    return cumulative;
  }

  return (
    <FloatingElement
      style={{ width: '300px', height: '480px', overflow: 'hidden' }}
    >
      <Title>Serum Orderbook</Title>
      <SizeTitle>
        <Col span={12} style={{ textAlign: 'left'}}>
          Size ({baseSymbol.toUpperCase()})
        </Col>
        <Col span={12} style={{ textAlign: 'right' }}>
          Price ({quoteSymbol.toUpperCase()})
        </Col>
      </SizeTitle>
      {orderbookData?.asks.map(({ price, size, sizePercent }) => (
        <OrderbookRow
          key={price + ''}
          price={price}
          size={size}
          side={'sell'}
          sizePercent={sizePercent}
        />
      ))}
      <Row>&nbsp;</Row>
      {orderbookData?.bids.map(({ price, size, sizePercent }) => (
        <OrderbookRow
          key={price + ''}
          price={price}
          size={size}
          side={'buy'}
          sizePercent={sizePercent}
        />
      ))}
    </FloatingElement>
  );
}

function priceLotsToNumber(
  price,
  baseLotSize,
  baseSplTokenDecimals,
  quoteLotSize,
  quoteSplTokenDecimals
) {
  return divideBnToNumber(
    price.mul(quoteLotSize).mul(baseSplTokenMultiplier(baseSplTokenDecimals)),
    baseLotSize.mul(quoteSplTokenMultiplier(quoteSplTokenDecimals))
  );
}

function baseSizeLotsToNumber(size, baseLotSize, baseSplTokenDecimals) {
  return divideBnToNumber(
    size.mul(baseLotSize),
    baseSplTokenMultiplier(baseSplTokenDecimals)
  );
}

function divideBnToNumber(numerator, denominator) {
  const quotient = numerator.div(denominator).toNumber();
  const rem = numerator.umod(denominator);
  const gcd = rem.gcd(denominator);
  return quotient + rem.div(gcd).toNumber() / denominator.div(gcd).toNumber();
}

function baseSplTokenMultiplier(baseSplTokenDecimals) {
  return new BN(10).pow(new BN(baseSplTokenDecimals));
}

function quoteSplTokenMultiplier(quoteSplTokenDecimals) {
  return new BN(10).pow(new BN(quoteSplTokenDecimals));
}

const OrderbookRow = React.memo(
  ({ side, price, size, sizePercent }) => {
    const element = useRef();

    const { baseLotSize, baseDecimals, quoteLotSize, quoteDecimals } =
      useSerum();

    const minOrderSize = baseSizeLotsToNumber(
      new BN(1),
      new BN(baseLotSize),
      baseDecimals
    );
    const tickSize = priceLotsToNumber(
      new BN(1),
      new BN(baseLotSize),
      baseDecimals,
      new BN(quoteLotSize),
      quoteDecimals
    );

    useEffect(() => {
      // eslint-disable-next-line
      !element.current?.classList.contains('flash') &&
        element.current?.classList.add('flash');
      const id = setTimeout(
        () =>
          element.current?.classList.contains('flash') &&
          element.current?.classList.remove('flash'),
        250
      );
      return () => clearTimeout(id);
    }, [price, size]);

    assert(minOrderSize);
    let formattedSize = Number(size).toFixed(getDecimalCount(minOrderSize) + 1);

    assert(tickSize);
    let formattedPrice = Number(price).toFixed(getDecimalCount(tickSize) + 1);

    return (
      <Row ref={element} style={{ marginBottom: 1 }}>
        <Col span={12} style={{ textAlign: 'left' }}>
          {formattedSize}
        </Col>
        <Col span={12} style={{ textAlign: 'right' }}>
        <Line
            data-width={sizePercent + '%'}
            data-bgcolor={
              side === 'buy'
                ? 'rgba(65, 199, 122, 0.6)'
                : 'rgba(242, 60, 105, 0.6)'
            }
          />
          <Price>{formattedPrice}</Price>
        </Col>
      </Row>
    );
  },
  (prevProps, nextProps) =>
    isEqual(prevProps, nextProps, ['price', 'size', 'sizePercent'])
);

function getDecimalCount(value) {
  if (
    !isNaN(value) &&
    Math.floor(value) !== value &&
    value.toString().includes('.')
  )
    return value.toString().split('.')[1].length || 0;
  if (
    !isNaN(value) &&
    Math.floor(value) !== value &&
    value.toString().includes('e')
  )
    return parseInt(value.toString().split('e-')[1] || '0');
  return 0;
}

function isEqual(obj1, obj2, keys) {
  if (!keys && Object.keys(obj1).length !== Object.keys(obj2).length) {
    return false;
  }
  keys = keys || Object.keys(obj1);
  for (const k of keys) {
    if (obj1[k] !== obj2[k]) {
      // shallow comparison
      return false;
    }
  }
  return true;
}
