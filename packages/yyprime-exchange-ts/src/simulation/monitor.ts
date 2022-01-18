import assert from 'assert';
import { Buffer } from 'buffer';
import { Keypair, PublicKey } from '@solana/web3.js';
import { SolanaClient } from '../solana';

import * as simulation from './simulation.json';

console.log(`[SIMULATION]`);
console.log('');

const solanaClient: SolanaClient = new SolanaClient(simulation);

(async () => {
  //console.log(`${JSON.stringify(await solanaClient.connection.getParsedAccountInfo(new PublicKey(simulation.config.serum.program)))}`);

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

  for (const market of simulation.markets) {
    console.log(`MARKET: ${market.symbol}`);

    const baseMint: PublicKey = new PublicKey(market.baseMint);
    const baseVault: Keypair = Keypair.fromSecretKey(Buffer.from(market.baseVaultPrivateKey, 'base64'));

    const quoteMint: PublicKey = new PublicKey(market.quoteMint);
    const quoteVault: Keypair = Keypair.fromSecretKey(Buffer.from(market.quoteVaultPrivateKey, 'base64'));

    const requestQueue: PublicKey = new PublicKey(market.requestQueue);
    const eventQueue: PublicKey = new PublicKey(market.eventQueue);
    const bids: PublicKey = new PublicKey(market.bids);
    const asks: PublicKey = new PublicKey(market.asks);

    //console.log(`  ${JSON.stringify(await solanaClient.connection.getParsedAccountInfo(new PublicKey(market.market)))}`);
    //console.log(`  ${JSON.stringify(await solanaClient.connection.getParsedAccountInfo(baseVault.publicKey))}`);
    //console.log(`  ${JSON.stringify(await solanaClient.connection.getParsedAccountInfo(quoteVault.publicKey))}`);
    //console.log(`  ${JSON.stringify(await solanaClient.connection.getParsedAccountInfo(requestQueue))}`);
    //console.log(`  ${JSON.stringify(await solanaClient.connection.getParsedAccountInfo(eventQueue))}`);
    //console.log(`  ${JSON.stringify(await solanaClient.connection.getParsedAccountInfo(bids))}`);
    //console.log(`  ${JSON.stringify(await solanaClient.connection.getParsedAccountInfo(asks))}`);

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
