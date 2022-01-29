import { Market } from '@project-serum/serum';
import { Keypair } from '@solana/web3.js';

import {
  PythPrice,
  PythToken,
  SerumBook,
  SerumClient,
  SolanaClient,
} from '@yyprime/yyprime-exchange-ts';

import { Bot } from './bot';

export class TakerBot extends Bot {

  constructor(config: any, market: Market, serumClient: SerumClient, solanaClient: SolanaClient, wallet: Keypair) {
    super(config, market, serumClient, solanaClient, wallet);
  }

  public onAsk(book: SerumBook) {
    const thresh = 0.75; // aggressiveness
    const tbias = 0.0;
    const rshift = 0.5 + tbias;
    const rando = 2. * (Math.random() - rshift);

    // hit the midpt
    //if( rando > thresh) this.placeOrder('buy', +(book.basePrice), 1., 'ioc')
  }

  public onBid(book: SerumBook) {
    const thresh = 0.75; // aggressiveness
    const tbias = 0.0;
    const rshift = 0.5 + tbias;
    const rando = 2. * (Math.random() - rshift);

    // hit the midpt
    //if( rando > thresh) this.placeOrder('sell', +(book.basePrice), 1., 'ioc')
  }

  public onPrice(book: SerumBook, token: PythToken, price: PythPrice) {
    const thresh = 1 - 0.05;
    const tbias = 0.0;
    const rshift = 0.5 + tbias;
    const rando = 2. * (Math.random() - rshift);

    if (rando > thresh || rando < -thresh) {
      (async () => {
        if (rando > thresh) {
          await this.placeOrder('buy', book.ask[0][0], book.ask[0][1], 'ioc');
        } else if (rando < -thresh) {
          await this.placeOrder('sell', book.bid[0][0], book.bid[0][1], 'ioc');
        }
      })();
    }
  }

}
