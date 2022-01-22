import BN from 'bn.js';
import {
  decodeEventQueue,
  decodeRequestQueue,
} from '@project-serum/serum';
import { ORDERBOOK_LAYOUT } from "@project-serum/serum/lib/market";
import React, { useContext } from 'react';
import { PublicKey } from '@solana/web3.js';

import { useAccountData } from './connection';//, useConnection
import { useConfiguration } from './configuration';

export interface SerumContextValues {
  symbol?: string,
  market?: PublicKey;
  baseSymbol?: string,
  baseDecimals?: number,
  baseLotSize?: number;
  quoteSymbol?: string,
  quoteDecimals?: number,
  quoteLotSize?: number;
  requestQueue?: PublicKey;
  eventQueue?: PublicKey;
  bids?: PublicKey;
  asks?: PublicKey;
}

const SerumContext: React.Context<null | SerumContextValues> = React.createContext<null | SerumContextValues>(
  null,
);

export function SerumProvider({ baseSymbol, quoteSymbol, children }) {
  const configuration = useConfiguration();
  const symbol = `${baseSymbol.toUpperCase()}/${quoteSymbol.toUpperCase()}`;
  const market = configuration.markets.find((market) => { return market.symbol === symbol; });
  return (
    <SerumContext.Provider
      value={{
        symbol,
        market: new PublicKey(market!.market),
        baseSymbol,
        baseDecimals: market!.baseDecimals,
        baseLotSize: market!.baseLotSize,
        quoteSymbol,
        quoteDecimals: market!.quoteDecimals,
        quoteLotSize: market!.quoteLotSize,
        requestQueue: new PublicKey(market!.requestQueue),
        eventQueue: new PublicKey(market!.eventQueue),
        bids: new PublicKey(market!.bids),
        asks: new PublicKey(market!.asks),
      }}
    >
      {children}
    </SerumContext.Provider>
  );
}

export function useSerum() {
  const context = useContext(SerumContext);
  if (!context) {
    throw new Error('Missing Serum context');
  }
  return context;
}

export function useSerumOrderbook(
  depth = 20,
) {
  const { bids, asks, baseLotSize, baseDecimals, quoteLotSize, quoteDecimals } = useSerum();

  // @ts-ignore
  let bidData = useAccountData(bids);
  // @ts-ignore
  let askData = useAccountData(asks);

  if (bidData && askData) {
    function decode(buffer) {
      const { accountFlags, slab } = ORDERBOOK_LAYOUT.decode(buffer);
      return { accountFlags: accountFlags, slab: slab };
    }
    return {
      bids: priceLevels(decode(bidData), depth, baseLotSize!, baseDecimals!, quoteLotSize!, quoteDecimals!).map(([price, size]) => [price, size]),
      asks: priceLevels(decode(askData), depth, baseLotSize!, baseDecimals!, quoteLotSize!, quoteDecimals!).map(([price, size]) => [price, size]),
    };
  } else {
    return { bids: [], asks: [] };
  }
}

function priceLevels(orderbook, depth: number, baseLotSize: number, baseDecimals: number, quoteLotSize: number, quoteDecimals: number): [number, number, BN, BN][] {
  const descending = orderbook.accountFlags.isBids;
  const levels: [BN, BN][] = []; // (price, size)
  for (const { key, quantity } of orderbook.slab.items(descending)) {
    const price = key.ushrn(64);
    if (levels.length > 0 && levels[levels.length - 1][0].eq(price)) {
      levels[levels.length - 1][1].iadd(quantity);
    } else if (levels.length === depth) {
      break;
    } else {
      levels.push([price, quantity]);
    }
  }
  return levels.map(([priceLots, sizeLots]) => [
    priceLotsToNumber(priceLots, new BN(baseLotSize), baseDecimals, new BN(quoteLotSize), quoteDecimals),
    baseSizeLotsToNumber(sizeLots, new BN(baseLotSize), baseDecimals),
    priceLots,
    sizeLots,
  ]);
}

function priceLotsToNumber(price: BN, baseLotSize: BN, baseSplTokenDecimals: number, quoteLotSize: BN, quoteSplTokenDecimals: number) {
  return divideBnToNumber(
    price.mul(quoteLotSize).mul(baseSplTokenMultiplier(baseSplTokenDecimals)),
    baseLotSize.mul(quoteSplTokenMultiplier(quoteSplTokenDecimals)),
  );
}

function baseSizeLotsToNumber(size: BN, baseLotSize: BN, baseSplTokenDecimals: number) {
  return divideBnToNumber(
    size.mul(baseLotSize),
    baseSplTokenMultiplier(baseSplTokenDecimals),
  );
}

function divideBnToNumber(numerator: BN, denominator: BN): number {
  const quotient = numerator.div(denominator).toNumber();
  const rem = numerator.umod(denominator);
  const gcd = rem.gcd(denominator);
  return quotient + rem.div(gcd).toNumber() / denominator.div(gcd).toNumber();
}

function baseSplTokenMultiplier(baseSplTokenDecimals: number) {
  return new BN(10).pow(new BN(baseSplTokenDecimals));
}

function quoteSplTokenMultiplier(quoteSplTokenDecimals: number) {
  return new BN(10).pow(new BN(quoteSplTokenDecimals));
}

export function useSerumEvents() {
  const { eventQueue } = useSerum();

  // @ts-ignore
  let eventQueueData = useAccountData(eventQueue);

  if (eventQueueData) {
    return decodeEventQueue(eventQueueData);
  } else {
    return [];
  }
}

export function useSerumRequests() {
  const { requestQueue } = useSerum();

  // @ts-ignore
  let requestQueueData = useAccountData(requestQueue);

  if (requestQueueData) {
    return decodeRequestQueue(requestQueueData);
  } else {
    return [];
  }
}
