import { Keypair } from "@solana/web3.js";

import { Bot, MarketMaker } from '../bots';
import { PythClient, PythPrice, PythToken } from '../pyth';
import { SerumBook, SerumClient } from '../serum';
import { SolanaClient } from '../solana';

import * as simulation from './simulation.json';

export class Simulator {
  simulation;
  pythClient: PythClient;
  serumClient: SerumClient;
  solanaClient: SolanaClient;
  bots: Bot[];

  constructor(simulation) {
    this.bots = [];
    this.pythClient = new PythClient(simulation, (token: PythToken, price: PythPrice) => { this.onPrice(token, price); });
    this.serumClient = new SerumClient(simulation, (book: SerumBook) => { this.onAsk(book); }, (book: SerumBook) => { this.onBid(book); });
    this.simulation = simulation;
    this.solanaClient = new SolanaClient(simulation);
  }

  public initialize(): Promise<void> {
    return (async () => {
      const payer: Keypair = Keypair.generate();
      await this.solanaClient.requestAirdrop(100, payer.publicKey);

      await this.solanaClient.createFaucets(payer);

      await this.serumClient.createMarkets(payer);

      for (const bot of this.simulation.bots) {
        const bot_payer: Keypair = Keypair.generate();
        await this.solanaClient.requestAirdrop(100, bot_payer.publicKey);

        switch (bot.type) {
          case "market_maker": this.bots.push(new MarketMaker(bot, bot_payer)); break;
          default: throw new Error(`Invalid bot type: ${bot.type}`);
        }
      }

      for (let bot of this.bots) {
        //TODO transfer tokens to the bot to trade.
      }

    })().then(() => {
      console.log(`Simulation initialized.`);

      this.pythClient.subscribe();

      this.serumClient.subscribe();
    });
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
