import { Keypair, PublicKey } from "@solana/web3.js";

import { Bot, FaderBot, FollowerBot, MakerBot, TakerBot } from '../bots';
import { PythClient, PythPrice, PythToken } from '../pyth';
import { SerumBook, SerumClient } from '../serum';
import { SolanaClient } from '../solana';

import * as simulation from './simulation.json';

(async () => {
  const pythClient: PythClient = new PythClient(simulation);
  const serumClient: SerumClient = new SerumClient(simulation);
  const solanaClient: SolanaClient = new SolanaClient(simulation);


  const wallet: Keypair = Keypair.fromSecretKey(Buffer.from(simulation.config.walletPrivateKey, 'base64'));
  await solanaClient.requestAirdrop(100, wallet.publicKey);

  await solanaClient.createFaucets(wallet);

  await serumClient.createMarkets(wallet);

  for (const bot of simulation.bots) {
    const bot_wallet = Keypair.fromSecretKey(Buffer.from(bot.walletPrivateKey, 'base64'));
    await solanaClient.requestAirdrop(100, bot_wallet.publicKey);

    await solanaClient.createTokenAccount(new PublicKey(bot.baseMint), bot_wallet.publicKey, bot_wallet);
    await solanaClient.sendToken(new PublicKey(bot.baseMint), bot.baseBalance, bot.baseDecimals, Keypair.fromSecretKey(Buffer.from(bot.baseFaucetPrivateKey, 'base64')), bot_wallet.publicKey, bot_wallet);

    await solanaClient.createTokenAccount(new PublicKey(bot.quoteMint), bot_wallet.publicKey, bot_wallet);
    await solanaClient.sendToken(new PublicKey(bot.quoteMint), bot.quoteBalance, bot.quoteDecimals, Keypair.fromSecretKey(Buffer.from(bot.quoteFaucetPrivateKey, 'base64')), bot_wallet.publicKey, bot_wallet);

    //TODO initOpenOrders
  }
})().then(() => {
  console.log(`Simulation started on ${simulation.config.cluster}`);
});
