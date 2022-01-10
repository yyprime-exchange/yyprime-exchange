//import { assert, expect } from "chai";

import { SerumClient } from '../src/serum'

describe('serum', () => {

  //it('Subscribe.', async () => {
    //const cluster: string = 'devnet';
    //const serumClient = new SerumClient(cluster);
    //await serumClient.subscribe();
  //});

  it('Subscribe.', async () => {
    const cluster: string = 'devnet';
    const serumClient = new SerumClient(cluster);
    //await serumClient.subscribe();
  });

  /*
  */

});
