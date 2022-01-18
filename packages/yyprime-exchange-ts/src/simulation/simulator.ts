import { Keypair, PublicKey } from "@solana/web3.js";

import { Bot, FaderBot, FollowerBot, MakerBot, TakerBot } from '../bots';
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
      const wallet: Keypair = Keypair.fromSecretKey(Buffer.from(this.simulation.config.walletPrivateKey, 'base64'));
      await this.solanaClient.requestAirdrop(100, wallet.publicKey);

      await this.solanaClient.createFaucets(wallet);

      await this.serumClient.createMarkets(wallet);

      await this.serumClient.initialize();

      for (const bot of this.simulation.bots) {
        const market = this.serumClient.getMarket(bot.market);
        const bot_wallet = Keypair.fromSecretKey(Buffer.from(bot.walletPrivateKey, 'base64'));
        await this.solanaClient.requestAirdrop(100, bot_wallet.publicKey);

        switch (bot.type) {
          case "maker": this.bots.push(new MakerBot(bot, market, this.serumClient, this.solanaClient, bot_wallet)); break;
          case "fader": this.bots.push(new FaderBot(bot, market, this.serumClient, this.solanaClient, bot_wallet)); break;
          case "follower": this.bots.push(new FollowerBot(bot, market, this.serumClient, this.solanaClient, bot_wallet)); break;
          case "taker": this.bots.push(new TakerBot(bot, market, this.serumClient, this.solanaClient, bot_wallet)); break;
          default: throw new Error(`Invalid bot type: ${bot.type}`);
        }
      }

      for (let bot of this.bots) {
        await this.solanaClient.createTokenAccount(new PublicKey(bot.config.baseMint), bot.wallet.publicKey, bot.wallet);
        await this.solanaClient.sendToken(new PublicKey(bot.config.baseMint), bot.config.baseBalance, bot.config.baseDecimals, Keypair.fromSecretKey(Buffer.from(bot.config.baseFaucetPrivateKey, 'base64')), bot.wallet.publicKey, bot.wallet);

        await this.solanaClient.createTokenAccount(new PublicKey(bot.config.quoteMint), bot.wallet.publicKey, bot.wallet);
        await this.solanaClient.sendToken(new PublicKey(bot.config.quoteMint), bot.config.quoteBalance, bot.config.quoteDecimals, Keypair.fromSecretKey(Buffer.from(bot.config.quoteFaucetPrivateKey, 'base64')), bot.wallet.publicKey, bot.wallet);

        //TODO initOpenOrders
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
