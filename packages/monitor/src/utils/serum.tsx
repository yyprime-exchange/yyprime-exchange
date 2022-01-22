import BN from 'bn.js';
import { ORDERBOOK_LAYOUT } from "@project-serum/serum/lib/market";
import React, { useContext } from 'react';
import { PublicKey } from '@solana/web3.js';

import { useAccountData } from './connection';//, useConnection
import { useConfiguration } from './configuration';

export interface SerumContextValues {
  symbol?: string,
  market?: PublicKey;
  baseSymbol?: string,
  //baseMint?: PublicKey;
  //baseDecimals?: number,
  quoteSymbol?: string,
  //quoteMint?: PublicKey;
  //quoteDecimals?: number,
  //requestQueue?: PublicKey;
  //eventQueue?: PublicKey;
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
        quoteSymbol,
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
  const { bids, asks } = useSerum();

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
      bids: priceLevels(decode(bidData), depth).map(([price, size]) => [price, size]),
      asks: priceLevels(decode(askData), depth).map(([price, size]) => [price, size]),
    };
  } else {
    return { bids: [], asks: [] };
  }
}

function priceLevels(orderbook, depth: number): [number, number][] {
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
    //this.market.priceLotsToNumber(priceLots),
    //this.market.baseSizeLotsToNumber(sizeLots),
    priceLots.toNumber(),
    sizeLots.toNumber(),
  ]);
}
