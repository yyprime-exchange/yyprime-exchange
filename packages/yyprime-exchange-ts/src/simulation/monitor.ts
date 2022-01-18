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
import { Keypair, PublicKey } from '@solana/web3.js';

import { SerumClient } from '../serum';
import { SolanaClient } from '../solana';

import * as simulation from './simulation.json';

console.log(`[SIMULATION]`);
console.log('');

const serumClient: SerumClient = new SerumClient(simulation);
const solanaClient: SolanaClient = new SolanaClient(simulation);

(async () => {
  //console.log(`${JSON.stringify(await solanaClient.connection.getParsedAccountInfo(new PublicKey(simulation.config.serum.program)))}`);

  /*
  for (const token of simulation.tokens) {
    console.log(`TOKEN: ${token.symbol}`);

    const mint: Keypair = Keypair.fromSecretKey(Buffer.from(token.mintPrivateKey, 'base64'));
    assert(mint.publicKey.toBase58() == new PublicKey(token.mint).toBase58());

    const vault: Keypair = Keypair.fromSecretKey(Buffer.from(token.vaultPrivateKey, 'base64'));

    console.log(`  ${JSON.stringify(await solanaClient.connection.getParsedAccountInfo(mint.publicKey))}`);
    console.log(`  ${JSON.stringify(await solanaClient.connection.getParsedAccountInfo(vault.publicKey))}`);
    console.log(`  MintSupply: ${(await solanaClient.getMintSupply(new PublicKey(token.mint), token.decimals))}`);
    console.log('');
  }
  */

  await serumClient.initialize();

  for (const market of simulation.markets) {
    console.log(`MARKET: ${market.symbol}`);

    /*
    console.log(`  ${JSON.stringify(serumClient.getMarket(market.market))}`);

    console.log(`  baseMint = ${JSON.stringify(await solanaClient.connection.getParsedAccountInfo(new PublicKey(market.baseMint)))}`);
    console.log(`  quoteMint = ${JSON.stringify(await solanaClient.connection.getParsedAccountInfo(new PublicKey(market.quoteMint)))}`);

    const requestQueueAccount = await solanaClient.connection.getAccountInfo(new PublicKey(market.requestQueue));
    const requests = decodeRequestQueue(requestQueueAccount!.data);
    for (const request of requests) {
      console.log(`  ${JSON.stringify(request)}`);
    }

    const eventQueueAccount = await solanaClient.connection.getAccountInfo(new PublicKey(market.eventQueue));
    const events = decodeEventQueue(eventQueueAccount!.data);
    for (const event of events) {
      console.log(`  ${JSON.stringify(event)}`);
    }
    */

    /*
    const asksAccount = await solanaClient.connection.getAccountInfo(new PublicKey(market.asks));
    console.log(`  ${JSON.stringify(Orderbook.decode(serumClient.getMarket(market.market), asksAccount!.data))}`);

    const bidsAccount = await solanaClient.connection.getAccountInfo(new PublicKey(market.bids));
    console.log(`  ${JSON.stringify(Orderbook.decode(serumClient.getMarket(market.market), bidsAccount!.data))}`);
    */

    console.log('');
  }

  for (const bot of simulation.bots) {
    console.log(`BOT: ${bot.name}`);

    const bot_wallet: Keypair = Keypair.fromSecretKey(Buffer.from(bot.walletPrivateKey, 'base64'));

    console.log(`  ${JSON.stringify(await solanaClient.connection.getParsedAccountInfo(bot_wallet.publicKey))}`);
    console.log(`  Balance = ${JSON.stringify(await solanaClient.getBalance(bot_wallet.publicKey))}`);
    console.log(`  BaseTokenBalance = ${JSON.stringify(await solanaClient.getTokenBalance(await solanaClient.getAssociatedTokenAddress(new PublicKey(bot.baseMint), bot_wallet.publicKey)))}`);
    console.log(`  QuoteTokenBalance = ${JSON.stringify(await solanaClient.getTokenBalance(await solanaClient.getAssociatedTokenAddress(new PublicKey(bot.quoteMint), bot_wallet.publicKey)))}`);
    console.log('');
  }

})().then(() => {

  console.log(`Monitoring simulation on ${simulation.config.cluster}`);

  /*
  const interval = 1000;

  let timerId = setTimeout(async function process() {



    timerId = setTimeout(process, interval);
  }, interval);
  */

});
