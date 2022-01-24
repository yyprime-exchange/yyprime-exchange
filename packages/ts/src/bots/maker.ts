import { BN } from "@project-serum/anchor";
import { Market } from '@project-serum/serum';
import { Keypair, PublicKey } from '@solana/web3.js';

import { Bot } from './bot';
import { PythPrice, PythToken } from '../pyth';
import { SerumBook, SerumClient } from '../serum';
import { SolanaClient } from '../solana';
//import { Bot, PythPrice, PythToken, SerumBook, SerumClient, SolanaClient } from '@yyprime/yyprime-exchange-ts';

export class MakerBot extends Bot {

  constructor(config: any, market: Market, serumClient: SerumClient, solanaClient: SolanaClient, wallet: Keypair, initialOrders) {
    super(config, market, serumClient, solanaClient, wallet);

    if (initialOrders) {
      (async () => {
        initialOrders.asks.forEach(async (order) => { await this.placeOrder('sell', order[0], order[1], 'postOnly'); });
        initialOrders.bids.forEach(async (order) => { await this.placeOrder('buy', order[0], order[1], 'postOnly'); });
      })();
    }
  }

  public async initialize(): Promise<void> {
  }

  public onAsk(book: SerumBook) {
    //console.log(JSON.stringify(book));
  }

  public onBid(book: SerumBook) {
    //console.log(JSON.stringify(book));
  }

  public onExit() {
    //TODO cancel all orders.
  }

  public onPrice(token: PythToken, price: PythPrice) {
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
