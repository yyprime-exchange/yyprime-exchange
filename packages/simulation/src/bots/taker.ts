import { Keypair } from '@solana/web3.js';
import { Market } from '@project-serum/serum';

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
    const thresh = 0.05;
    const tbias = 0.0;
    const rshift = 0.5 + tbias;
    var rando = 2. * (Math.random() - rshift);
    //if( rando > thresh) this.placeOrder('buy', +(book.ask), 1., 'ioc')
  }

  public onBid(book: SerumBook) {
    const thresh = 0.05;
    const tbias = 0.0;
    const rshift = 0.5 + tbias;
    const rando = 2. * (Math.random() - rshift);
    //if( rando > thresh) this.placeOrder('sell', +(book.bid), 1., 'ioc')

    //console.log(`rando = ${rando}`);
    //console.log(`thresh = ${thresh}`);
    //console.log(`+(book.bid) = ${+(book.bid)}`);
    //console.log(``);
  }

  public onPrice(book: SerumBook, token: PythToken, price: PythPrice) {
    const thresh = 1 - 0.05;
    const tbias = 0.0;
    const rshift = 0.5 + tbias;
    const rando = 2. * (Math.random() - rshift);

    console.log(`book.ask[0] = ${JSON.stringify(book.ask[0])}`);
    console.log(`book.bid[0] = ${JSON.stringify(book.bid[0])}`);
    if (rando > thresh || rando < -thresh) {
      console.log(`rando = ${rando}`);
      console.log(`thresh = ${thresh}`);

      async () => {
        if (rando > thresh) {
          this.placeOrder('buy', book.ask[0][0], book.ask[0][1], 'ioc');
        } else if (rando < -thresh) {
          this.placeOrder('sell', book.bid[0][0], book.bid[0][1], 'ioc');
        }
      }
    }
    console.log(``);
  }

}
