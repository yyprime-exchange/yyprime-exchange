import BN from 'bn.js';
import {
  decodeEventQueue,
  DexInstructions,
} from '@project-serum/serum';
import {
  Commitment,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
} from '@solana/web3.js';

import * as simulation from './simulation.json';

export class Crank {
  commitment: Commitment = 'finalized';
  connection: Connection;
  consumeEventsLimit: BN;
  public interval: number;
  maxUniqueAccounts: number;
  payer: Keypair;
  simulation;

  constructor(simulation, payer: Keypair) {
    this.connection = new Connection(simulation.config.serum.url);
    this.consumeEventsLimit = new BN(process.env.CONSUME_EVENTS_LIMIT || '10');
    this.interval = parseInt(process.env.INTERVAL || '4000');
    this.maxUniqueAccounts = parseInt(process.env.MAX_UNIQUE_ACCOUNTS || '10');
    this.payer = payer;
    this.simulation = simulation;
  }

  public async initialize(): Promise<void> {
    /*
    this.markets = await Promise.all(
      groupIds.spotMarkets.map((m) => {
        return Market.load(
          connection,
          m.publicKey,
          {
            skipPreflight: true,
            commitment: 'processed' as Commitment,
          },
          mangoGroup.dexProgramId,
        );
      }),
    );
  */

    for (const market of simulation.markets) {
    }
      /*
   const quoteToken = new Token(
     connection,
     spotMarkets[0].quoteMintAddress,
     TOKEN_PROGRAM_ID,
     payer,
   );
   const quoteWallet = await quoteToken
     .getOrCreateAssociatedAccountInfo(payer.publicKey)
     .then((a) => a.address);

   const baseWallets = await Promise.all(
     spotMarkets.map((m) => {
       const token = new Token(
         connection,
         m.baseMintAddress,
         TOKEN_PROGRAM_ID,
         payer,
       );

       return token
         .getOrCreateAssociatedAccountInfo(payer.publicKey)
         .then((a) => a.address);
     }),
   );
    */

  }

  public async turn(): Promise<void> {

    for (const market of simulation.markets) {
      const accountInfo = await this.connection.getAccountInfo(new PublicKey(market.eventQueue));
      if (!accountInfo) {
        continue;
      }

      //TODO Match Orders



      const events = decodeEventQueue(accountInfo.data);
      if (events.length === 0) {
        continue;
      }

      const accounts: Set<string> = new Set();
      for (const event of events) {
        accounts.add(event.openOrders.toBase58());

        // Limit unique accounts to first 10
        if (accounts.size >= this.maxUniqueAccounts) {
          break;
        }
      }

      const openOrdersAccounts = [...accounts]
        .map((s) => new PublicKey(s))
        .sort((a, b) => a.toBuffer().swap64().compare(b.toBuffer().swap64()));

      /*
      let transaction = new Transaction().add(
        DexInstructions.consumeEvents({
          market: new PublicKey(market.market),
          eventQueue: new PublicKey(market.eventQueue),
          coinFee: market.baseWallet,
          pcFee: market.quoteWallet,
          openOrdersAccounts,
          limit: this.consumeEventsLimit,
          programId: new PublicKey(simulation.config.serum.program),
        })
      );
      transaction.feePayer = this.payer.publicKey;
      await this.connection.sendTransaction(transaction, [payer]);
      */
    }
  }

}



const payer: Keypair = Keypair.generate();

const crank: Crank = new Crank(simulation, payer);

(async () => {
  const airdropSignature = await crank.connection.requestAirdrop(payer.publicKey, 100 * LAMPORTS_PER_SOL);
  await crank.connection.confirmTransaction(airdropSignature);

  await crank.initialize();
})().then(() => {
  console.log(`Running crank on ${simulation.config.cluster}`);

  let timerId = setTimeout(async function process() {
    console.log(`Crank ${new Date().toLocaleTimeString()}`);
    await crank.turn();
    timerId = setTimeout(process, crank.interval);
  }, crank.interval);

});
