import { Keypair, PublicKey } from "@solana/web3.js";

import { PythClient, PythPrice, PythToken } from '../pyth';
import { SerumBook, SerumClient } from '../serum';
import { SolanaClient } from '../solana';

import * as simulation from './simulation.json';

export class Simulator {
  simulation;
  pythClient: PythClient;
  serumClient: SerumClient;
  solanaClient: SolanaClient;

  constructor(simulation) {
    this.pythClient = new PythClient(simulation, this.onPrice);
    this.serumClient = new SerumClient(simulation, this.onAsk, this.onBid);
    this.simulation = simulation;
    this.solanaClient = new SolanaClient(simulation);
  }

  public initialize(): Promise<void> {
    return (async () => {
      const payer: Keypair = Keypair.generate();

      await this.solanaClient.requestAirdrop(100, payer.publicKey);

      await this.solanaClient.createFaucets(payer);

      await this.serumClient.createMarkets(payer);

      // Create bots that will trade.

      // Fund bots.

    })().then(() => {
      console.log(`Simulation initialized.`);

      //this.pythClient.subscribe();

      //this.serumClient.subscribe();
    });
  }

  private onAsk(book: SerumBook) {
    for (const bot of this.simulation.bots) {
      //bot.onAsk(book);
    }
  }

  private onBid(book: SerumBook) {
    for (const bot of this.simulation.bots) {
      //bot.onBid(book);
    }
  }

  private onPrice(token: PythToken, price: PythPrice) {
    for (const bot of this.simulation.bots) {
      //bot.onPrice(token, price);
    }
  }

  public onTime() {
    for (const bot of this.simulation.bots) {
      //bot.onTime();
    }
  }

}



const simulator: Simulator = new Simulator(simulation);

(async () => {
  await simulator.initialize();
})().then(() => {
  console.log(`Running simulation on ${simulation.config.cluster}`);

  /*
  let timerId = setTimeout(function process() {
    simulator.onTime();

    timerId = setTimeout(process, 1000);
  }, 1000);
  */

});
