import assert from 'assert';
import { Buffer } from 'buffer';
import {
  decodeEventQueue,
  decodeRequestQueue,
  Orderbook,
} from '@project-serum/serum';
import {
  decodeMintAccountData,
  decodeTokenAccountData,
} from '@project-serum/token';
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import {
  SerumBook,
  SerumClient,
  SolanaClient,
} from '@yyprime/yyprime-exchange-ts';

import * as simulation from './simulation.json';

const serumClient: SerumClient = new SerumClient(simulation);
const solanaClient: SolanaClient = new SolanaClient(simulation);

(async () => {
  //console.log(`${JSON.stringify(await solanaClient.connection.getParsedAccountInfo(new PublicKey(simulation.config.serum.program)))}`);

  console.log(`[SIMULATION]`);
  console.log(`  simulation.config.wallet = ${JSON.stringify(await solanaClient.connection.getParsedAccountInfo(new PublicKey(simulation.config.wallet)))}`);
  console.log(`  Balance = ${(await solanaClient.connection.getBalance(new PublicKey(simulation.config.wallet))) / LAMPORTS_PER_SOL} SOL`);
  console.log('');

  for (const token of simulation.tokens) {
    const mint: Keypair = Keypair.fromSecretKey(Buffer.from(token.mintPrivateKey, 'base64'));
    assert(mint.publicKey.toBase58() == new PublicKey(token.mint).toBase58());

    const vault: Keypair = Keypair.fromSecretKey(Buffer.from(token.vaultPrivateKey, 'base64'));

    console.log(`TOKEN: ${token.symbol}`);
    console.log(`  mint = ${JSON.stringify(await solanaClient.connection.getParsedAccountInfo(mint.publicKey))}`);
    console.log(`  vault = ${JSON.stringify(await solanaClient.connection.getParsedAccountInfo(vault.publicKey))}`);
    console.log(`  Supply: ${(await solanaClient.getMintSupply(new PublicKey(token.mint), token.decimals))}`);
    console.log('');
  }

  await serumClient.initialize();

  for (const market of simulation.markets) {
    console.log(`MARKET: ${market.symbol}`);
    console.log(`  ${JSON.stringify(serumClient.getMarket(market.market))}`);
    console.log(`  baseMint = ${JSON.stringify(await solanaClient.connection.getParsedAccountInfo(new PublicKey(market.baseMint)))}`);
    console.log(`  quoteMint = ${JSON.stringify(await solanaClient.connection.getParsedAccountInfo(new PublicKey(market.quoteMint)))}`);

    const requestQueueAccount = await solanaClient.connection.getAccountInfo(new PublicKey(market.requestQueue));
    const requests = decodeRequestQueue(requestQueueAccount!.data);
    for (const request of requests) {
      console.log(`  request ${JSON.stringify(request)}`);
    }

    const eventQueueAccount = await solanaClient.connection.getAccountInfo(new PublicKey(market.eventQueue));
    const events = decodeEventQueue(eventQueueAccount!.data);
    for (const event of events) {
      console.log(`  event ${JSON.stringify(event)}`);
    }

    const asksAccount = await solanaClient.connection.getAccountInfo(new PublicKey(market.asks));
    console.log(`  asks = ${JSON.stringify(Orderbook.decode(serumClient.getMarket(market.market), asksAccount!.data))}`);

    const bidsAccount = await solanaClient.connection.getAccountInfo(new PublicKey(market.bids));
    console.log(`  bids = ${JSON.stringify(Orderbook.decode(serumClient.getMarket(market.market), bidsAccount!.data))}`);

    console.log('');
  }

  for (const bot of simulation.bots) {
    const bot_wallet: Keypair = Keypair.fromSecretKey(Buffer.from(bot.walletPrivateKey, 'base64'));
    console.log(`BOT: ${bot.name}`);
    console.log(`  bot.wallet = ${JSON.stringify(await solanaClient.connection.getParsedAccountInfo(bot_wallet.publicKey))}`);
    console.log(`  Balance = ${(await solanaClient.connection.getBalance(bot_wallet.publicKey)) / LAMPORTS_PER_SOL} SOL`);
    console.log(`  BaseTokenBalance = ${JSON.stringify(await solanaClient.getTokenBalance(await solanaClient.getAssociatedTokenAddress(new PublicKey(bot.baseMint), bot_wallet.publicKey)))}`);
    console.log(`  QuoteTokenBalance = ${JSON.stringify(await solanaClient.getTokenBalance(await solanaClient.getAssociatedTokenAddress(new PublicKey(bot.quoteMint), bot_wallet.publicKey)))}`);
    console.log('');
  }

})().then(() => {

  console.log(`Monitoring simulation on ${simulation.config.cluster}`);

  function onAsk(book: SerumBook) {
    console.log(`  ask ${JSON.stringify(book)}`);
  }

  function onBid(book: SerumBook) {
    console.log(`  bid ${JSON.stringify(book)}`);
  }

  function onEvent(book: SerumBook, events) {
    for (const event of events) {
      console.log(`  event ${JSON.stringify(event)}`);
    }
  }

  serumClient.subscribe(
    (book: SerumBook) => { onAsk(book); },
    (book: SerumBook) => { onBid(book); },
    (book: SerumBook, events) => { onEvent(book, events); },
  );

});
