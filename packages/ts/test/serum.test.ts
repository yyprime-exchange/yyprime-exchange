import { assert, expect } from "chai";

import { SerumClient } from '../src/serum'

describe('serum', () => {

  it('Connect to devnet.', async () => {
    const serumClient = new SerumClient(
      {
        config: {
          serum: {
            program: "DESVgJVGajEgKGXhb6XmqDHGz3VjdgP7rEVESBgxmroY",
            url: "https://api.devnet.solana.com/"
          }
        },
        markets: [
        ]
      }
    );
  });

});
