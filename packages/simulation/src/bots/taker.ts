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
      var rando = 2.*(Math.random() - rshift);

        if( rando > thresh) this.placeOrder( 'buy' ,+(book.ask) , 1.,  'ioc' )
  }

  public onBid(book: SerumBook) {
      const thresh = 0.05;
      const tbias = 0.0;
      const rshift = 0.5 + tbias;
      var rando = 2.*(Math.random() - rshift);

        if( rando > thresh) this.placeOrder( 'sell' ,+(book.bid) , 1.,  'ioc' )
  }

  public onExit() {
    //TODO cancel all orders.
  }

  public onPrice(token: PythToken, price: PythPrice) {
      const thresh = 0.05;
      const tbias = 0.0;
      const rshift = 0.5 + tbias;
      if (price.price) {
        async () => {
          var rando = 2.*(Math.random() - rshift);
          //bot may try to order the wrong side bc naive to spread
          if (rando > thresh) {
            this.placeOrder('buy', price.price, 1., 'ioc');
          } else if (rando < -1. * thresh) {
            this.placeOrder('sell', price.price, 1., 'ioc');
          }
        }
      }
    // don't see this doing anything so on to the serum based taker
    //
    //
  }

}
