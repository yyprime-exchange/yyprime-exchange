import { decodeEventQueue } from '@project-serum/serum';
import { toPriceLevels } from '@yyprime/yyprime-exchange-ts';
import React, { useContext, useEffect, useState } from 'react';
import { PublicKey } from '@solana/web3.js';

import { useConfiguration } from './configuration';
import { useAccountData } from './connection';

export interface SerumContextValues {
  symbol?: string,
  market?: PublicKey;
  baseSymbol?: string,
  baseLotSize?: number;
  baseDecimals?: number,
  quoteSymbol?: string,
  quoteLotSize?: number;
  quoteDecimals?: number,
  requestQueue?: PublicKey;
  eventQueue?: PublicKey;
  bids?: PublicKey;
  asks?: PublicKey;
}

export const SerumContext: React.Context<null | SerumContextValues> = React.createContext<null | SerumContextValues>(
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
): [{ bids: number[][]; asks: number[][] }, boolean] {
  const { bids, asks, baseLotSize, baseDecimals, quoteLotSize, quoteDecimals } = useSerum();

  // @ts-ignore
  let bidData = useAccountData(bids);
  // @ts-ignore
  let askData = useAccountData(asks);

  let b: number[][] = [];
  let a: number[][] = [];

  if (bidData && askData) {
    return [{
      bids: toPriceLevels(bidData, depth, baseLotSize!, baseDecimals!, quoteLotSize!, quoteDecimals!).map(([price, size]) => [price, size]),
      asks: toPriceLevels(askData, depth, baseLotSize!, baseDecimals!, quoteLotSize!, quoteDecimals!).map(([price, size]) => [price, size]),
    }, false];
  }
  return [{ bids: b, asks: a }, !!b || !!a];
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

export function useSerumQuote() {
  const [bestBid, setBestBid] = useState<null | number>(null);
  const [bestAsk, setBestAsk] = useState<null | number>(null);

  const orderbook = useSerumOrderbook();

  useEffect(() => {
    let best_bid =
      orderbook[0]?.bids?.length > 0 &&
      orderbook[0]?.bids.sort((a, b) => Number(b[0]) - Number(a[0]))[0][0];
    let best_ask =
      orderbook[0]?.asks?.length > 0 &&
      orderbook[0]?.asks.sort((a, b) => Number(a[0]) - Number(b[0]))[0][0];
    if (best_bid && best_ask) {
      setBestBid(best_bid);
      setBestAsk(best_ask);
    }
  }, [orderbook]);

  return { bestBid, bestAsk };
}
