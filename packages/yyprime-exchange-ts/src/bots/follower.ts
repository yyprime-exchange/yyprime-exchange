import { Keypair } from '@solana/web3.js';
import { Market } from '@project-serum/serum';

import { Bot } from './bot';
import { PythPrice, PythToken } from '../pyth';
import { SerumBook, SerumClient } from '../serum';
import { SolanaClient } from '../solana';

export class FollowerBot extends Bot {

  constructor(config: any, market: Market, serumClient: SerumClient, solanaClient: SolanaClient, wallet: Keypair) {
    super(config, market, serumClient, solanaClient, wallet);
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
    //console.log(JSON.stringify(token));
    //console.log(JSON.stringify(price));
    //console.log('');
  }

}
