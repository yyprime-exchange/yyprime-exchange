import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { YyprimeExchange } from '../target/types/yyprime_exchange';

describe('yyprime-exchange', () => {

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.YyprimeExchange as Program<YyprimeExchange>;

  it('Is initialized!', async () => {
    // Add your test here.
    const tx = await program.rpc.initialize({});
    console.log("Your transaction signature", tx);
  });

});
