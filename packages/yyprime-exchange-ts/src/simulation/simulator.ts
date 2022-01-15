import { Keypair, PublicKey } from "@solana/web3.js";

import { PythClient, PythPrice, PythToken } from '../pyth';
import { SerumBook, SerumClient } from '../serum';
import { SolanaClient } from '../solana';

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
    console.log(`Running simulation on ${simulation.config.cluster}`);
  }

  public initialize() {
    (async () => {
      const payer: Keypair = Keypair.generate();
      await this.solanaClient.requestAirdrop(10, payer.publicKey);

      await this.simulation.tokens.forEach(async (token) => {
        if (token.symbol !== 'SOL') {
          const mint: Keypair = Keypair.fromSecretKey(Buffer.from(token.mintPrivateKey, 'base64'));

          const faucet: Keypair = Keypair.fromSecretKey(Buffer.from(token.faucetPrivateKey, 'base64'));
          await this.solanaClient.requestAirdrop(1, faucet.publicKey);

          await this.solanaClient.createFaucet(payer, mint, token.decimals, faucet, 1_000_000);
        }
      });


      //TODO Create a market.


      // Create users who will trade.
      // Fund agents.

    })();

    //this.pythClient.subscribe();

    //this.serumClient.subscribe();
  }

  private onAsk(book: SerumBook) {
  }

  private onBid(book: SerumBook) {
  }

  private onPrice(token: PythToken, price: PythPrice) {
  }

  public process() {
  }

}
