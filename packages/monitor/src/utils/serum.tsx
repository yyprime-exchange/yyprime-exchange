import BN from 'bn.js';
import { decodeEventQueue } from '@project-serum/serum';
import { Market, ORDERBOOK_LAYOUT } from "@project-serum/serum/lib/market";
import React, { useContext, useEffect, useState } from 'react';
import { PublicKey } from '@solana/web3.js';

import { useConfiguration } from './configuration';
import { useAccountData, useConnection } from './connection';

export interface SerumContextValues {
  market?: Market | undefined | null;
  symbol?: string,
  marketAddress?: PublicKey;
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
  const connection = useConnection();
  const symbol = `${baseSymbol.toUpperCase()}/${quoteSymbol.toUpperCase()}`;
  const marketInfo = configuration.markets.find((market) => { return market.symbol === symbol; });
  const [market, setMarket] = useState<Market | null>();

  useEffect(() => {
    if (
      market &&
      marketInfo &&
      // @ts-ignore
      market._decoded.ownAddress?.equals(marketInfo?.market)
    ) {
      return;
    }
    setMarket(null);
    if (!marketInfo || !marketInfo.market) {
      console.log('Error loading market')
      debugger;
      return;
    }
    Market.load(connection, new PublicKey(marketInfo.market), {}, new PublicKey("9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin"))
      .then(setMarket)
      .catch((e) => {
        console.log('Error loading market while loading')
      });
    // eslint-disable-next-line
  }, [connection, marketInfo]);

  return (
    <SerumContext.Provider
      value={{
        symbol,
        marketAddress: new PublicKey(marketInfo!.market),
        baseSymbol,
        baseDecimals: marketInfo!.baseDecimals,
        baseLotSize: marketInfo!.baseLotSize,
        quoteSymbol,
        quoteDecimals: marketInfo!.quoteDecimals,
        quoteLotSize: marketInfo!.quoteLotSize,
        requestQueue: new PublicKey(marketInfo!.requestQueue),
        eventQueue: new PublicKey(marketInfo!.eventQueue),
        bids: new PublicKey(marketInfo!.bids),
        asks: new PublicKey(marketInfo!.asks),
        market: market,
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
  // console.log(bids?.toBase58(), "bids address")
  // console.log(asks?.toBase58(), "asks address")

  // @ts-ignore
  let bidData = useAccountData(bids);
  // @ts-ignore
  let askData = useAccountData(asks);

  let b: number[][] = [];
  let a: number[][] = [];

  if (bidData && askData) {
    // console.log("seeing bid and ask data inside serumorderbook")
    function decode(buffer) {
      const { accountFlags, slab } = ORDERBOOK_LAYOUT.decode(buffer);
      return { accountFlags: accountFlags, slab: slab };
    }

    return [{
      bids: priceLevels(decode(bidData), depth, baseLotSize!, baseDecimals!, quoteLotSize!, quoteDecimals!).map(([price, size]) => [price, size]),
      asks: priceLevels(decode(askData), depth, baseLotSize!, baseDecimals!, quoteLotSize!, quoteDecimals!).map(([price, size]) => [price, size]),
    }, false];
  }
  return [{ bids: b, asks: a }, !!b || !!a];
}

function priceLevels(orderbook, depth: number, baseLotSize: number, baseDecimals: number, quoteLotSize: number, quoteDecimals: number): [number, number, BN, BN][] {
  const descending = orderbook.accountFlags.bids;
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
