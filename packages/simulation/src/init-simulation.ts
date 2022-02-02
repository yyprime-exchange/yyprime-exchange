import {
  OpenOrders,
} from "@project-serum/serum";
import {
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction
} from "@solana/web3.js";
import {
  PythClient,
  SerumClient,
  SolanaClient,
} from '../../ts/src/index';

import * as simulation from './simulation.json';

(async () => {
  const pythClient: PythClient = new PythClient(simulation);
  const serumClient: SerumClient = new SerumClient(simulation);
  const solanaClient: SolanaClient = new SolanaClient(simulation);

  const wallet: Keypair = Keypair.fromSecretKey(Buffer.from(simulation.config.walletPrivateKey, 'base64'));
  await solanaClient.requestAirdrop(simulation.config.walletBalance, wallet.publicKey);

  await solanaClient.createTokens(wallet);

  await serumClient.createMarkets(wallet);

  for (const bot of simulation.bots) {
    const bot_wallet = Keypair.fromSecretKey(Buffer.from(bot.walletPrivateKey, 'base64'));
    await solanaClient.requestAirdrop(bot.walletBalance, bot_wallet.publicKey);

    //const baseTokenAccount = await solanaClient.getAssociatedTokenAddress(new PublicKey(bot.baseMint), bot_wallet.publicKey);
    const baseTokenAccount = await solanaClient.createTokenAccount(new PublicKey(bot.baseMint), bot_wallet.publicKey, bot_wallet);
    await solanaClient.sendToken(
      new PublicKey(bot.baseMint),
      bot.baseBalance,
      bot.baseDecimals,
      wallet,
      new PublicKey(bot.baseVault),
      baseTokenAccount,
    );

    //const quoteTokenAccount = await solanaClient.getAssociatedTokenAddress(new PublicKey(bot.quoteMint), bot_wallet.publicKey);
    const quoteTokenAccount = await solanaClient.createTokenAccount(new PublicKey(bot.quoteMint), bot_wallet.publicKey, bot_wallet);
    await solanaClient.sendToken(
      new PublicKey(bot.quoteMint),
      bot.quoteBalance,
      bot.quoteDecimals,
      wallet,
      new PublicKey(bot.quoteVault),
      quoteTokenAccount,
    );

    const openOrders: Keypair = Keypair.fromSecretKey(Buffer.from(bot.openOrdersPrivateKey, 'base64'));

    //const transaction = new Transaction().add(
      //await OpenOrders.makeCreateAccountTransaction(
        //serumClient.connection,
        //new PublicKey(bot.market),
        //bot_wallet.publicKey,
        //openOrders.publicKey,
        //new PublicKey(simulation.config.serum.program))
    //);
    //await sendAndConfirmTransaction(serumClient.connection, transaction, [bot_wallet, openOrders]);

    const transaction = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: bot_wallet.publicKey,
        newAccountPubkey: openOrders.publicKey,
        lamports: await serumClient.connection.getMinimumBalanceForRentExemption(OpenOrders.getLayout(new PublicKey(simulation.config.serum.program)).span),
        space: OpenOrders.getLayout(new PublicKey(simulation.config.serum.program)).span,
        programId: new PublicKey(simulation.config.serum.program),
      }),
    );
    await sendAndConfirmTransaction(serumClient.connection, transaction, [bot_wallet, openOrders]);
  }

})().then(() => {
  console.log(`Simulation started on ${simulation.config.cluster}`);
});
