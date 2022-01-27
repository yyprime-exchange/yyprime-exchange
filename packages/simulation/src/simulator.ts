import { Keypair, PublicKey } from "@solana/web3.js";
import {
  PythClient,
  PythPrice,
  PythToken,
  SerumBook,
  SerumClient,
  SolanaClient,
} from '@yyprime/yyprime-exchange-ts';

import {
  Bot,
  MakerBot,
  TakerBot,
} from './bots';

import * as simulation from './simulation.json';

export class Simulator {
  simulation;
  pythClient: PythClient;
  serumClient: SerumClient;
  solanaClient: SolanaClient;
  bots: Bot[];

  constructor(simulation) {
    this.bots = [];
    this.pythClient = new PythClient(simulation);
    this.serumClient = new SerumClient(simulation);
    this.simulation = simulation;
    this.solanaClient = new SolanaClient(simulation);
  }

  public async initialize(): Promise<void> {
    await this.serumClient.initialize();

    for (const bot of this.simulation.bots) {
      const market = this.serumClient.getMarket(bot.market);
      const bot_wallet = Keypair.fromSecretKey(Buffer.from(bot.walletPrivateKey, 'base64'));

      let initialOrders = simulation.orders.find(orders => orders.symbol === bot.symbol);

      switch (bot.type) {
        case "maker": this.bots.push(new MakerBot(bot, market, this.serumClient, this.solanaClient, bot_wallet, initialOrders)); break;
        case "taker": this.bots.push(new TakerBot(bot, market, this.serumClient, this.solanaClient, bot_wallet)); break;
        default: throw new Error(`Invalid bot type: ${bot.type}`);
      }
    }

    this.pythClient.subscribe((token: PythToken, price: PythPrice) => { this.onPrice(token, price); });

    this.serumClient.subscribe(
      (book: SerumBook) => { this.onAsk(book); },
      (book: SerumBook) => { this.onBid(book); },
      (book: SerumBook, events) => { this.onEvent(book, events); },
      (requests) => { this.onRequest(requests); },
    );
  }

  private onAsk(book: SerumBook) {
    for (let bot of this.bots) {
      bot.onAsk(book);
    }
  }

  private onBid(book: SerumBook) {
    for (let bot of this.bots) {
      bot.onBid(book);
    }
  }

  private onEvent(book: SerumBook, events) {
  }

  private onRequest(requests) {
  }

  private onPrice(token: PythToken, price: PythPrice) {
    for (let bot of this.bots) {
      bot.onPrice(token, price);
    }
  }

}



const simulator: Simulator = new Simulator(simulation);

(async () => {
  await simulator.initialize();
})().then(() => {
  console.log(`Running simulation on ${simulation.config.cluster}`);
});
