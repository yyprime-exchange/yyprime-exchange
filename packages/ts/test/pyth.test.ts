import { assert, expect } from "chai";

import { PythClient } from '../src/pyth'

describe('pyth', () => {

  it('Connect to devnet.', async () => {
    const pythClient = new PythClient(
      {
        config: {
          pyth: {
            program: "gSbePebfvPy7tRqimPoVecS2UsBvYv46ynrzWocc92s",
            url: "https://api.devnet.solana.com/"
          }
        },
        tokens: [
        ]
      }
    );
  });

});
