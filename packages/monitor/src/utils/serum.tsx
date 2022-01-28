import BN from 'bn.js';
import {
  decodeEventQueue,
  decodeRequestQueue,
} from '@project-serum/serum';
import { Market, ORDERBOOK_LAYOUT, MARKET_STATE_LAYOUT_V2, MARKET_STATE_LAYOUT_V3 } from "@project-serum/serum/lib/market";
import React, { useContext, useEffect, useReducer, useState } from 'react';
import { PublicKey } from '@solana/web3.js';

import { useAccountData, useConnection } from './connection';//, useConnection
import { useConfiguration } from './configuration';
import { any } from 'prop-types';
import { useAsyncData } from './fetch-loop';
import tuple from 'immutable-tuple';

// For things that don't really change
const _SLOW_REFRESH_INTERVAL = 5 * 1000;

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


// const initialState = {   market: null,
//   symbol: null,
//   marketAddress: null,
//   baseSymbol: null,
//   baseDecimals: null,
//   baseLotSize: null,
//   quoteSymbol: null,
//   quoteDecimals: null,
//   quoteLotSize: null,
//   requestQueue: null,
//   eventQueue: null,
//   bids: null,
//   asks: null,
//   // historicalSerumPriceData: [],
//   // currentMarkPrice: null,
//   // dispatch: null,
//   // connection: null
// }


export function SerumProvider({ baseSymbol, quoteSymbol, children }) {
  // const [state, dispatch] = useReducer(reducer, initialState)
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
      // notify({
      //   message: 'Error loading market',
      //   description: 'Please select a market from the dropdown',
      //   type: 'error',
      // });
      debugger;
      return;
    }
    Market.load(connection, new PublicKey(marketInfo.market), {}, new PublicKey("9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin"))
      .then(setMarket)
      .catch((e) => {
        console.log('Error loading market while loading')
        // notify({
        //   message: 'Error loading market',
        //   description: e.message,
        //   type: 'error',
        // }),
      }
      );
    // eslint-disable-next-line
  }, [connection, marketInfo]);
  // console.log(market, "market loaded")
  // const market = new Market(
  //   MARKET_STATE_LAYOUT_V3, 
  //   Number(marketInfo?.baseDecimals),
  //   Number(marketInfo?.quoteDecimals),
  //   {},
  //   marketInfo.programId,
  // );

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
        // currentMarkPrice: state.currentMarkPrice,
        // historicalSerumPriceData: state.historicalSerumPriceData,
        // dispatch, 
        // connection
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

export function loadMarketFills(connection, market) {
  // const connection = useConnection()
  if (!market || connection) {
    return null
  }

  try {
    
    const loadedFills = market.loadFills(connection, 10000)
    return loadedFills
  } catch (err) {
    console.log('Error fetching fills:', err)
  }
}

export function _useUnfilteredTrades(limit = 10000) {
  const { market } = useSerum();
  const connection = useConnection();

  // console.log("market", market)
  async function getUnfilteredTrades(): Promise<any[] | null> {
    if (!market || !connection) {
      return null;
    }
    return await market.loadFills(connection, limit);
  }
  const [trades] = useAsyncData(
    getUnfilteredTrades,
    tuple('getUnfilteredTrades', market, connection),
    { refreshInterval: _SLOW_REFRESH_INTERVAL },
  );
  return trades;
  // NOTE: For now, websocket is too expensive since the event queue is large
  // and updates very frequently

  // let data = useAccountData(market && market._decoded.eventQueue);
  // if (!data) {
  //   return null;
  // }
  // const events = decodeEventQueue(data, limit);
  // return events
  //   .filter((event) => event.eventFlags.fill && event.nativeQuantityPaid.gtn(0))
  //   .map(market.parseFillEvent.bind(market));
}

export function useTrades(limit = 100) {
  const trades = _useUnfilteredTrades(limit);
  // console.log(trades)
  if (!trades) {
    return null;
  }
  // Until partial fills are each given their own fill, use maker fills
  return trades
  // @ts-ignore
    .filter(({ eventFlags }) => eventFlags.maker)
    .map((trade) => ({
      // @ts-ignore
      ...trade,
      // @ts-ignore
      side: trade.side === 'buy' ? 'sell' : 'buy',
    }));
}

// export function useMarkPrice() {
//   const [markPrice, setMarkPrice] = useState<null | number>(null);
//   const orderbook = useSerumOrderbook();
//   const trades = useTrades();
//   const { dispatch, currentMarkPrice } = useSerum();
//   useEffect(() => {
//     let bb = orderbook?.bids?.length > 0 && Number(orderbook?.bids[0][0]);
//     let ba = orderbook?.asks?.length > 0 && Number(orderbook?.asks[0][0]);
//     let last = trades && trades.length > 0 && trades[0].price;

//     let markPrice =
//       bb && ba
//         ? last
//           ? [bb, ba, last].sort((a, b) => a - b)[1]
//           : (bb + ba) / 2
//         : null;
//     if(dispatch) {
//       if (markPrice !== currentMarkPrice) {
//         dispatch({type: "setMarkPrice", markPrice: markPrice})
//         dispatch({type: "setHistorialSerumPriceData", pricePoint: markPrice})

//       }
//     }
//     setMarkPrice(markPrice);
//   }, [orderbook, trades])
//   console.log('markprice!')
//   if (!markPrice) return 0
//   return markPrice;
// }


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
function getDecimalCount(tickSize: any): any {
  throw new Error('Function not implemented.');
}

