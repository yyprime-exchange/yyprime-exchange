import { Keypair } from '@solana/web3.js';

import { Bot } from './bot';
import { PythPrice, PythToken } from '../pyth';
import { SerumBook } from '../serum';

export class RandomTaker extends Bot {

  constructor(botConfig: any, payer: Keypair) {
    super(botConfig, payer);
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
