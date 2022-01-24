import { Keypair } from '@solana/web3.js';
import { Market } from '@project-serum/serum';

import { Bot } from './bot';
import { PythPrice, PythToken } from '../pyth';
import { SerumBook, SerumClient } from '../serum';
import { SolanaClient } from '../solana';

export class TakerBot extends Bot {

  constructor(config: any, market: Market, serumClient: SerumClient, solanaClient: SolanaClient, wallet: Keypair) {
    super(config, market, serumClient, solanaClient, wallet);
  }

  //Randomly trades.

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
      const thresh = 0.5;
      if (price.price) {
        var rando = 2.*(Math.random() - 0.5);
        //bot may try to order the wrong side bc naive to spread
        if( rando > thresh){
         this.placeOrder( 'buy' , price.price, 1.,  'ioc' );
        }else if (rando < -1.*thresh){
         this.placeOrder( 'sell' , price.price, 1.,  'ioc' );
        }
      }
    //console.log(JSON.stringify(token));
    //console.log(JSON.stringify(price));
    //console.log('');
  }

}
