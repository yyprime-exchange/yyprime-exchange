import { Market } from '@project-serum/serum';
import { Keypair } from '@solana/web3.js';

import {
  PythPrice,
  PythToken,
  SerumBook,
  SerumClient,
  SolanaClient,
} from '../../../ts/src/index';

import { Bot } from './bot';

export class MakerBot extends Bot {

  constructor(config: any, market: Market, serumClient: SerumClient, solanaClient: SolanaClient, wallet: Keypair, initialOrders) {
    super(config, market, serumClient, solanaClient, wallet);

    //TODO cancel all open orders.

    if (initialOrders) {
      (async () => {
        initialOrders.asks.forEach(async (order) => { await this.placeOrder('sell', order[0], order[1], 'postOnly'); });
        initialOrders.bids.forEach(async (order) => { await this.placeOrder('buy', order[0], order[1], 'postOnly'); });
      })();
    }
  }

  public onAsk(book: SerumBook) {
  }

  public onBid(book: SerumBook) {
  }

  public onPrice(book: SerumBook, token: PythToken, price: PythPrice) {
    (async () => {
      if (price.price) {

        //TODO adjust orders.

        //const half_spread = price.price * this.config.half_spread;
        //const ask_price = price.price + half_spread;
        //const bid_price = price.price - half_spread;

      }
    })();
  }

}
