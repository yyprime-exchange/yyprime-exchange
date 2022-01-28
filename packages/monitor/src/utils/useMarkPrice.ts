import { useEffect, useState } from 'react';
import { useSerum, useSerumOrderbook, useTrades } from './serum';

export function useMarkPrice() {
    const [currentMarkPrice, setMarkPrice] = useState<null | number>(null);
    const [bestBid, setBestBid] = useState<null | number>(null);
    const [bestAsk, setBestAsk] = useState<null | number>(null);

    const orderbook = useSerumOrderbook();
    const trades = useTrades();
    // const { dispatch, currentMarkPrice } = useSerum();
    useEffect(() => {
      let bb = orderbook?.bids?.length > 0 && Number(orderbook?.bids[0][0]);
      let ba = orderbook?.asks?.length > 0 && Number(orderbook?.asks[0][0]);
      let last = trades && trades.length > 0 && trades[0].price;
        
      let best_bid = orderbook?.bids?.length > 0 && orderbook?.bids.sort((a,b)=> Number(b[0])-Number(a[0]))[0][0]
      let best_ask = orderbook?.asks?.length > 0  && orderbook?.asks.sort((a,b)=> Number(a[0])-Number(b[0]))[0][0]
        console.log("bbba", bb, ba, last)
      let markPrice =
        bb && ba
          ? last
            ? [bb, ba, last].sort((a, b) => a - b)[1]
            : (bb + ba) / 2
          : null;
        setMarkPrice(markPrice);
        if(best_bid && best_ask) {
            setBestBid(best_bid);
            setBestAsk(best_ask);
        }
    }, [orderbook, trades])

    return { currentMarkPrice, bestBid, bestAsk };
  }
  