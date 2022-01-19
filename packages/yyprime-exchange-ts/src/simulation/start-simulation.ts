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

  //TODO I don't like this.
  await solanaClient.requestAirdrop(100, wallet.publicKey);

  await solanaClient.createTokens(wallet);

  await serumClient.createMarkets(wallet);

  for (const bot of simulation.bots) {
    const bot_wallet = Keypair.fromSecretKey(Buffer.from(bot.walletPrivateKey, 'base64'));
    await solanaClient.requestAirdrop(100, bot_wallet.publicKey);

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

    //TODO initOpenOrders
    /*
          const openOrdersSpace = OpenOrders.getLayout(
            mangoGroup.dexProgramId,
          ).span;

          const openOrdersLamports =
            await this.connection.getMinimumBalanceForRentExemption(
              openOrdersSpace,
              'processed',
            );

          const accInstr = await createAccountInstruction(
            this.connection,
            owner.publicKey,
            openOrdersSpace,
            mangoGroup.dexProgramId,
            openOrdersLamports,
          );

          const initOpenOrders = makeInitSpotOpenOrdersInstruction(
            this.programId,
            mangoGroup.publicKey,
            mangoAccount.publicKey,
            owner.publicKey,
            mangoGroup.dexProgramId,
            accInstr.account.publicKey,
            spotMarket.publicKey,
            mangoGroup.signerKey,
          );

          const initTx = new Transaction();

          initTx.add(accInstr.instruction);
          initTx.add(initOpenOrders);

          await this.sendTransaction(initTx, owner, [accInstr.account]);
    */
  }
})().then(() => {
  console.log(`Simulation started on ${simulation.config.cluster}`);
});
