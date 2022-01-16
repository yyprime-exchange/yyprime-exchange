import {
  Account,
  Commitment,
  Connection,
  PublicKey,
  Transaction,
} from '@solana/web3.js';
import fs from 'fs';
import os from 'os';
import BN  = require('bn.js');

const interval = parseInt(process.env.INTERVAL || '10000');

//TODO a single controller for all bots.
/*
  process.on('SIGINT', function () {
    console.log('Caught keyboard interrupt. Canceling orders');
    control.isRunning = false;
    onExit(
      client,
      payer,
      YYPXProgramId,
      YYPXGroup,
      perpMarket,
      YYPXAccountPk,
    );
  });
*/

/*
  while (control.isRunning) {
    try {
    } catch (e) {
      // sleep for some time and retry
      console.log(e);
    } finally {
      console.log(`sleeping for ${interval / 1000}s`);
      await sleep(interval);
    }
  }
*/

export class Bot {
  readonly name: string;
  readonly market: string;

  public control = {
    isRunning: true,
    interval: interval,
  };

  //public readonly cluster = process.env.CLUSTER || 'localnet';

  constructor(name: string, market: string) {
    this.name = name;
    this.market = market;

    //TODO
    /*
    const payer = new Account(
      JSON.parse(
        fs.readFileSync(
          process.env.KEYPAIR || os.homedir() + '/.config/solana/id.json',
          'utf-8',
        ),
      ),
    );
    console.log(`Payer: ${payer.publicKey.toBase58()}`);
    */
  }

  process() {
    console.log("BOT PROCESSING: " + this.name);
  }


async function onExit(
  client: YYPXClient,
  payer: Account,
  YYPXProgramId: PublicKey,
  YYPXGroup: YYPXGroup,
  perpMarket: PerpMarket,
  YYPXAccountPk: PublicKey,
) {
  await sleep(control.interval);
  const YYPXAccount = await client.getYYPXAccount(
    YYPXAccountPk,
    YYPXGroup.dexProgramId,
  );

  const cancelAllInstr = makeCancelAllPerpOrdersInstruction(
    YYPXProgramId,
    YYPXGroup.publicKey,
    YYPXAccount.publicKey,
    payer.publicKey,
    perpMarket.publicKey,
    perpMarket.bids,
    perpMarket.asks,
    new BN(20),
  );
  const tx = new Transaction();
  tx.add(cancelAllInstr);

  const txid = await client.sendTransaction(tx, payer, []);
  console.log(`cancel successful: ${txid.toString()}`);

  process.exit();
}


  /*
process.on('unhandledRejection', function (err, promise) {
  console.error(
    'Unhandled rejection (promise: ',
    promise,
    ', reason: ',
    err,
    ').',
  );
});
  */

}
