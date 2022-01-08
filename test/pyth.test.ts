import { assert, expect } from "chai";

import { Cluster } from '@solana/web3.js'
import { PythClient } from '../src/pyth'

describe('pyth', () => {

  it('Query Products.', async () => {
    const cluster: string = 'devnet';
    const pythClient = new PythClient(cluster);
    const products = await pythClient.queryProducts();
    //products.forEach(product => {
      //console.log(JSON.stringify(product));
    //});
  });

  //it('Subscribe.', async () => {
    //const cluster: string = 'devnet';
    //const pythClient = new PythClient(cluster);
    //await pythClient.subscribe();
  //});

});
