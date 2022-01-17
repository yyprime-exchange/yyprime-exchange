import { Keypair, PublicKey } from '@solana/web3.js';

import { PythPrice, PythToken } from '../pyth';
import { SerumBook } from '../serum';

export abstract class Bot {
  readonly config: any;

  public control = {
    isRunning: true,
  };

  public position = {
    currentPosition: 0,
  };

  readonly wallet: Keypair;

  constructor(botConfig: any, wallet: Keypair) {
    this.config = botConfig;
    this.wallet = wallet;
  }

  public abstract onAsk(book: SerumBook);
  public abstract onBid(book: SerumBook);
  public abstract onExit();
  public abstract onPrice(token: PythToken, price: PythPrice);

}
