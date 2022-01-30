import { assert } from "chai";
import { Keypair } from '@solana/web3.js';
import { SolanaClient } from '../src/solana'

describe('solana', () => {

  it('Connect to devnet.', async () => {
    const solanaClient = new SolanaClient(
      {
        config: {
          solana: {
            http: "http://api.devnet.solana.com/"
          }
        }
      }
    );
  });

  it('Request airdrop.', async () => {
    const solanaClient = new SolanaClient(
      {
        config: {
          solana: {
            http: "http://api.devnet.solana.com/"
          }
        }
      }
    );

    const keypair: Keypair = Keypair.generate();

    let balance: number = await solanaClient.getBalance(keypair.publicKey);
    assert.equal(balance, 0);

    await solanaClient.requestAirdrop(1, keypair.publicKey);

    balance = await solanaClient.getBalance(keypair.publicKey);
    assert.equal(balance, 1_000_000_000);
  });

  it('Send SOL.', async () => {
    const solanaClient = new SolanaClient(
      {
        config: {
          solana: {
            http: "http://api.devnet.solana.com/"
          }
        }
      }
    );

    const keypair1: Keypair = Keypair.generate();

    let balance1: number = await solanaClient.getBalance(keypair1.publicKey);
    assert.equal(balance1, 0);

    await solanaClient.requestAirdrop(1, keypair1.publicKey);

    balance1 = await solanaClient.getBalance(keypair1.publicKey);
    assert.equal(balance1, 1_000_000_000);


    const keypair2: Keypair = Keypair.generate();

    let balance2: number = await solanaClient.getBalance(keypair2.publicKey);
    assert.equal(balance2, 0);

    const costToSend = await solanaClient.costToSend(0.5, keypair1, keypair2.publicKey);
    await solanaClient.send(0.5, keypair1, keypair2.publicKey);

    balance1 = await solanaClient.getBalance(keypair1.publicKey);
    balance2 = await solanaClient.getBalance(keypair2.publicKey);
    assert.equal(balance1, 500_000_000 - costToSend);
    assert.equal(balance2, 500_000_000);
  });

});
