import { Keypair } from '@solana/web3.js';

import { PythPrice, PythToken } from '../pyth';
import { SerumBook } from '../serum';

export abstract class Bot {
  readonly base: string;
  readonly baseBalance: number;
  readonly name: string;
  readonly quote: string;
  readonly quoteBalance: number;
  readonly symbol: string;
  readonly type: string;

  readonly params: any;

  readonly payer: Keypair;

  public control = {
    isRunning: true,
  };

  constructor(botConfig: any, payer: Keypair) {
    this.base = botConfig.base;
    this.baseBalance = botConfig.baseBalance;
    this.name = botConfig.name;
    this.quote = botConfig.quote;
    this.quoteBalance = botConfig.quoteBalance;
    this.symbol = botConfig.symbol;
    this.type = botConfig.type;

    this.params = botConfig.params;

    this.payer = payer;
  }

  public abstract onAsk(book: SerumBook);
  public abstract onBid(book: SerumBook);
  public abstract onExit();
  public abstract onPrice(token: PythToken, price: PythPrice);

}
