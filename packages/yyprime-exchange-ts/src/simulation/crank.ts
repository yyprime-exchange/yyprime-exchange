import BN from 'bn.js';
import {
  decodeEventQueue,
  DexInstructions,
} from "@project-serum/serum";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';

import { SerumBook, SerumClient } from '../serum';
import { SolanaClient } from '../solana';

import * as simulation from './simulation.json';

const wallet: Keypair = Keypair.fromSecretKey(Buffer.from(simulation.config.walletPrivateKey, 'base64'));
const walletTokenAccounts: Map<string, PublicKey> = new Map();

const serumClient: SerumClient = new SerumClient(simulation);
const solanaClient: SolanaClient = new SolanaClient(simulation);

(async () => {
  const airdropSignature = await serumClient.connection.requestAirdrop(wallet.publicKey, 100 * LAMPORTS_PER_SOL);
  await serumClient.connection.confirmTransaction(airdropSignature);

  await Promise.all(
    simulation.tokens.map(async (token) => {
      const tokenAccount = await solanaClient.getAssociatedTokenAddress(new PublicKey(token.mint), wallet.publicKey);
      walletTokenAccounts.set(token.mint, tokenAccount);
    })
  );

  await serumClient.initialize();
})().then(() => {

  console.log(`Running crank on ${simulation.config.cluster}`);

  const consumeEventsLimit: BN = new BN(process.env.CONSUME_EVENTS_LIMIT || '10');
  const interval: number = parseInt(process.env.INTERVAL || '4000');
  const maxUniqueAccounts: number = parseInt(process.env.MAX_UNIQUE_ACCOUNTS || '10');

  function onEvent(book: SerumBook, events) {
    const accounts: Set<PublicKey> = new Set();
    for (const event of events) {
      accounts.add(event.openOrders.toBase58());
      if (accounts.size >= maxUniqueAccounts) break;
    }
    (async () => {
      const openOrdersAccounts = [...accounts]
        .map((s) => new PublicKey(s))
        .sort((a, b) => a.toBuffer().swap64().compare(b.toBuffer().swap64()));

      console.log(`consumeEvents(${accounts.size})`);
      let transaction = new Transaction().add(
        DexInstructions.consumeEvents({
          market: new PublicKey(book.market),
          eventQueue: new PublicKey(book.eventQueue),
          coinFee: walletTokenAccounts.get(book.baseMint),
          pcFee: walletTokenAccounts.get(book.quoteMint),
          openOrdersAccounts,
          limit: consumeEventsLimit,
          programId: new PublicKey(simulation.config.serum.program),
        })
      );

      transaction.feePayer = wallet.publicKey;
      await serumClient.connection.sendTransaction(transaction, [wallet]);
    })();
  }

  function onRequest(requests) {
    for (const request of requests) {
      //TODO Match Orders
      //console.log(`  request ${JSON.stringify(request)}`);
    }
  }

  serumClient.subscribe(
    null,
    null,
    (book: SerumBook, events) => { onEvent(book, events); },
    (requests) => { onRequest(requests); },
  );

  //let timerId = setTimeout(async function process() {
    (async () => {
      for (const book of serumClient.books.values()) {
        const accountInfo = await serumClient.connection.getAccountInfo(new PublicKey(book.eventQueue));
        if (!accountInfo) {
          continue;
        }
        const events = decodeEventQueue(accountInfo.data);
        if (events.length > 0) {
          onEvent(book, events);
        }
      }
    })();
  //  timerId = setTimeout(process, interval);
  //}, interval);

});
