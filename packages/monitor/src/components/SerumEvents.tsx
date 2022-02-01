import { Col, Row } from 'antd';
import BN from 'bn.js';
import React from 'react';

import { useSerum, useSerumEvents } from '../utils/serum';
import FloatingElement from './layout/FloatingElement';
import { Title } from './styles';

export default function SerumEvents() {
  const events = useSerumEvents();
  const { baseLotSize, baseDecimals, quoteLotSize, quoteDecimals } = useSerum();
  return (
    <FloatingElement style={{  width: '400px', height: '608px' }} >
      <Title >Serum Events</Title>
        <Row style={{color: "#FF0000"}}>
          <Col span={3}><b>Type</b></Col>
          <Col span={3}><b>State</b></Col>
          <Col span={3}><b>Side</b></Col>
          <Col span={7}><b>Price</b></Col>
          <Col span={7}><b>Size</b></Col>
        </Row>
      {events.slice(0, 22).map((event, index) => (
        <Row key={index}>
          <Col span={3}>{event.eventFlags.maker ? 'Maker' : 'Taker'}</Col>
          <Col span={3}>{event.eventFlags.fill ? 'Fill' : 'Out'}</Col>
          <Col span={3}>{event.eventFlags.bid ? 'Bid' : 'Ask'}</Col>
          <Col span={7}>{parseFillEvent(event, baseDecimals!, quoteDecimals!).price}</Col>
          <Col span={7}>{parseFillEvent(event, baseDecimals!, quoteDecimals!).size}</Col>
        </Row>
      ))}
    </FloatingElement>
  );
};

function parseFillEvent(event, baseDecimals: number, quoteDecimals: number) {
  let size, price, priceBeforeFees;
  if (event.eventFlags.bid) {
    priceBeforeFees = event.eventFlags.maker
      ? event.nativeQuantityPaid.add(event.nativeFeeOrRebate)
      : event.nativeQuantityPaid.sub(event.nativeFeeOrRebate);
    if (event.nativeQuantityReleased.toNumber() === 0) {
      price = (0).toFixed(2);
    } else {
      price = divideBnToNumber(
        priceBeforeFees.mul(tokenMultiplier(baseDecimals)),
        tokenMultiplier(quoteDecimals).mul(event.nativeQuantityReleased),
      ).toFixed(2);
    }
    size = divideBnToNumber(
      event.nativeQuantityReleased,
      tokenMultiplier(baseDecimals),
    ).toFixed(2);
  } else {
    priceBeforeFees = event.eventFlags.maker
      ? event.nativeQuantityReleased.sub(event.nativeFeeOrRebate)
      : event.nativeQuantityReleased.add(event.nativeFeeOrRebate);
    if (event.nativeQuantityPaid.toNumber() === 0) {
      price = (0).toFixed(2);
    } else {
      price = divideBnToNumber(
        priceBeforeFees.mul(tokenMultiplier(baseDecimals)),
        tokenMultiplier(quoteDecimals).mul(event.nativeQuantityPaid),
      ).toFixed(2);
    }
    size = divideBnToNumber(
      event.nativeQuantityPaid,
      tokenMultiplier(baseDecimals),
    ).toFixed(2);
  }
  return {
    price,
    size,
  };
}

function divideBnToNumber(numerator: BN, denominator: BN): number {
  const quotient = numerator.div(denominator).toNumber();
  const rem = numerator.umod(denominator);
  const gcd = rem.gcd(denominator);
  return quotient + rem.div(gcd).toNumber() / denominator.div(gcd).toNumber();
}

function tokenMultiplier(tokenMintDecimals: number) {
  return new BN(10).pow(new BN(tokenMintDecimals));
}
