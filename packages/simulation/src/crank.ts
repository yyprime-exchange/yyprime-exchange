import { BN } from "@project-serum/anchor";
import {
  decodeEventQueue,
  DexInstructions,
} from "@project-serum/serum";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
} from '@solana/web3.js';
import {
  SerumBook,
  SerumClient,
  SolanaClient,
} from '@yyprime/yyprime-exchange-ts';

import * as simulation from './simulation.json';

const wallet: Keypair = Keypair.fromSecretKey(Buffer.from(simulation.config.walletPrivateKey, 'base64'));
const walletTokenAccounts: Map<string, PublicKey> = new Map();

const serumClient: SerumClient = new SerumClient(simulation);
const solanaClient: SolanaClient = new SolanaClient(simulation);

const payer: Keypair = Keypair.generate();

(async () => {
  const airdropSignature = await serumClient.connection.requestAirdrop(payer.publicKey, 100 * LAMPORTS_PER_SOL);
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
    if (events.length > 0) {
      console.log(`onEvent()`);
      const accounts: Set<PublicKey> = new Set();
      for (const event of events) {
        accounts.add(event.openOrders.toBase58());
        if (accounts.size >= maxUniqueAccounts) break;
      }
      (async () => {
        console.log(`consumeEvents(${accounts.size})`);
        const openOrdersAccounts = [...accounts]
          .map((s) => new PublicKey(s))
          .sort((a, b) => a.toBuffer().swap64().compare(b.toBuffer().swap64()));
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

        transaction.feePayer = payer.publicKey;
        await serumClient.connection.sendTransaction(transaction, [payer]);
      })();
    }
  }

  serumClient.subscribe(
    null,
    null,
    (book: SerumBook, events) => { onEvent(book, events); },
  );

  //let timerId = setTimeout(async function process() {
    (async () => {
      for (const book of serumClient.books.values()) {
        const accountInfo = await serumClient.connection.getAccountInfo(new PublicKey(book.eventQueue));
        if (!accountInfo) {
          continue;
        }
        const events = decodeEventQueue(accountInfo.data);
        onEvent(book, events);
      }
    })();
  //  timerId = setTimeout(process, interval);
  //}, interval);

});
