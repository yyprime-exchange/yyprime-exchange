import { assert, expect } from "chai";

import { ZetaMarketsClient } from '../src/zetamarkets'

describe('zetamarkets', () => {

  it('??? Query Products.', async () => {
    const cluster: string = 'devnet';
    const zetaMarketsClient = new ZetaMarketsClient(cluster);
  });

});
