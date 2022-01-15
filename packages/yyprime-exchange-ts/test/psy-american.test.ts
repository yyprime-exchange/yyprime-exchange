import { assert, expect } from "chai";

import { Cluster } from '@solana/web3.js'
import { PsyAmericanClient } from '../src/psyoptions/psy-american'

describe('psy-american', () => {

  it('??? Query Products.', async () => {
    const cluster: string = 'devnet';
    const psyAmericanClient = new PsyAmericanClient(cluster);
  });

});
