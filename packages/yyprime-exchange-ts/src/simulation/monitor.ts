import assert from 'assert';
import { Buffer } from 'buffer';
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Keypair, PublicKey } from '@solana/web3.js';
//import { PythPrice, PythToken, PythClient } from '../pyth';
//import { SerumBook, SerumClient } from '../serum';
import { SolanaClient } from '../solana';

import * as simulation from './simulation.json';

console.log(`[SIMULATION]`);
console.log('');

const solanaClient: SolanaClient = new SolanaClient(simulation);

(async () => {
  console.log(`${JSON.stringify(await solanaClient.connection.getParsedAccountInfo(new PublicKey(simulation.config.serum.program)))}`);

  for (const token of simulation.tokens) {
    console.log(`TOKEN: ${token.symbol}`);

    const mint: Keypair = Keypair.fromSecretKey(Buffer.from(token.mintPrivateKey, 'base64'));
    assert(mint.publicKey.toBase58() == new PublicKey(token.mint).toBase58());

    const faucet: Keypair = Keypair.fromSecretKey(Buffer.from(token.faucetPrivateKey, 'base64'));

    console.log(`MintSupply: ${(await solanaClient.getMintSupply(new PublicKey(token.mint), token.decimals))}`);
    console.log(`FaucetTokenBalance = ${JSON.stringify(await solanaClient.getTokenBalance(mint.publicKey, faucet.publicKey))}`);
    //console.log(`${JSON.stringify(await solanaClient.connection.getParsedAccountInfo(mint.publicKey))}`);
    //console.log(`${JSON.stringify(await solanaClient.connection.getParsedAccountInfo(faucet.publicKey))}`);
    //console.log(`${JSON.stringify(await solanaClient.connection.getParsedAccountInfo(await solanaClient.getAssociatedTokenAddress(mint.publicKey, faucet.publicKey)))}`);
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

    console.log(`${JSON.stringify(await solanaClient.connection.getParsedAccountInfo(baseVault.publicKey))}`);
    console.log(`${JSON.stringify(await solanaClient.connection.getParsedAccountInfo(quoteVault.publicKey))}`);
    console.log(`${JSON.stringify(await solanaClient.connection.getParsedAccountInfo(requestQueue))}`);
    console.log(`${JSON.stringify(await solanaClient.connection.getParsedAccountInfo(eventQueue))}`);
    console.log(`${JSON.stringify(await solanaClient.connection.getParsedAccountInfo(bids))}`);
    console.log(`${JSON.stringify(await solanaClient.connection.getParsedAccountInfo(asks))}`);

    console.log('');
  }

  /*
  for (const bot of simulation.bots) {
    console.log(`BOT: ${bot.name}`);
    console.log('');
  }
  */

})().then(() => {
  console.log(`Monitoring simulation on ${simulation.config.cluster}`);

  /*
  const pythClient: PythClient = new PythClient(
    simulation,
    (token: PythToken, price: PythPrice) => {
      console.log(`[PRICE]`);
      console.log(`product = ${token.symbol}`);
      console.log(`price = ${price.price}`);
      console.log(`confidence = ${price.confidence}`);
      console.log('');
    },
  );
  pythClient.subscribe();
  */

  /*
  const serumClient: SerumClient = new SerumClient(
    simulation,
    (book: SerumBook) => {
      console.log("ASK " + book.symbol);
    },
    (book: SerumBook) => {
      console.log("BID " + book.symbol);
    },
  );
  serumClient.initialize();
  serumClient.subscribe();
  */

});
