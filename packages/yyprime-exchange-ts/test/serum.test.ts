import { assert, expect } from "chai";
import {
  Keypair,
} from '@solana/web3.js';

import { SerumClient, SerumSimulator } from '../src/serum'
import { SolanaClient } from '../src/solana'

describe('serum', () => {

  it('Create Serum Simulator.', async () => {
    const cluster: string = 'localnet';
    const serumSimulator: SerumSimulator = new SerumSimulator(cluster);
    await serumSimulator.initialize();
    await serumSimulator.createTokens(5);

    /*
    const marketConfig = {
      baseMint: serumSimulator.tokens[0].mint,
      baseLotSize: 100,
      quoteMint: serumSimulator.tokens[1].mint,
      quoteLotSize: 100,
      feeRateBps: 0,
    };
    serumSimulator.createMarket(marketConfig.baseMint, marketConfig.baseLotSize, marketConfig.quoteMint, marketConfig.quoteLotSize, marketConfig.feeRateBps);
    */

    /*
        await OpenOrdersPda.marketAuthority(
          market.publicKey,
          this.serumProgram,
          proxyProgramId
        ),
        pruneAuthority: await Identity.pruneAuthority(
          market.publicKey,
          this.serumProgram,
          proxyProgramId
        ),
        crankAuthority: await Identity.consumeEventsAuthority(
          market.publicKey,
          this.serumProgram,
          proxyProgramId
        ),
    */

    console.log(JSON.stringify(serumSimulator.tokens));


    /*
  //
  // Create all mints and funded god accounts.
  //
  const mintGods = await faucet.createMintGods(provider, 2);
  const [mintGodA, mintGodB] = mintGods;

  //
  // Fund an additional account.
  //
  const fundedAccount = await faucet.createFundedAccount(
    provider,
    mintGods.map((mintGod) => {
      return {
        ...mintGod,
        amount: new BN("10000000000000").muln(10 ** faucet.DECIMALS),
      };
    }),
    marketMaker.KEYPAIR
  );

  //
  // Structure the market maker object.
  //
  const marketMakerAccounts = {
    ...fundedAccount,
    baseToken: fundedAccount.tokens[mintGodA.mint.toString()],
    quoteToken: fundedAccount.tokens[mintGodB.mint.toString()],
  };

  //
  // List the market.
  //
  const [marketAPublicKey] = await marketLister.list({
    connection: provider.connection,
    wallet: provider.wallet,
    baseMint: mintGodA.mint,
    quoteMint: mintGodB.mint,
    baseLotSize: 100000,
    quoteLotSize: 100,
    dexProgramId: DEX_PID,
    proxyProgramId,
    feeRateBps: 0,
  });

  //
  // Load a proxy client for the market.
  //
  const marketProxyClient = await marketProxy.load(
    provider.connection,
    proxyProgramId,
    DEX_PID,
    marketAPublicKey
  );

  //
  // Market maker initializes an open orders account.
  //
  await marketMaker.initOpenOrders(
    provider,
    marketProxyClient,
    marketMakerAccounts
  );

  //
  // Market maker posts trades on the orderbook.
  //
  await marketMaker.postOrders(
    provider,
    marketProxyClient,
    marketMakerAccounts
  );

  //
  // Done.
  //
  return {
    marketProxyClient,
    mintA: mintGodA.mint,
    usdc: mintGodB.mint,
    godA: mintGodA.god,
    godUsdc: mintGodB.god,
  };
    */


  });

});
