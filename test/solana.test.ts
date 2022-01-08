import { assert } from "chai";
import { Token } from "@solana/spl-token";
import { Keypair } from '@solana/web3.js';
import { SolanaClient } from '../src/solana'

describe('solana', () => {

  it('Connect to devnet.', async () => {
    const cluster: string = 'devnet';
    const solanaClient = new SolanaClient(cluster);
  });

  it('Request airdrop.', async () => {
    const cluster: string = 'localnet';
    const solanaClient = new SolanaClient(cluster);

    const keypair: Keypair = solanaClient.generateKeypair();

    let balance: number = await solanaClient.getBalance(keypair.publicKey);
    assert.equal(balance, 0);

    await solanaClient.requestAirdrop(1, keypair.publicKey);

    balance = await solanaClient.getBalance(keypair.publicKey);
    assert.equal(balance, 1_000_000_000);
  });

  it('Send SOL.', async () => {
    const cluster: string = 'localnet';
    const solanaClient = new SolanaClient(cluster);

    const keypair1: Keypair = solanaClient.generateKeypair();

    let balance1: number = await solanaClient.getBalance(keypair1.publicKey);
    assert.equal(balance1, 0);

    await solanaClient.requestAirdrop(1, keypair1.publicKey);

    balance1 = await solanaClient.getBalance(keypair1.publicKey);
    assert.equal(balance1, 1_000_000_000);


    const keypair2: Keypair = solanaClient.generateKeypair();

    let balance2: number = await solanaClient.getBalance(keypair2.publicKey);
    assert.equal(balance2, 0);

    const costToSend = await solanaClient.costToSend(0.5, keypair1, keypair2.publicKey);
    await solanaClient.send(0.5, keypair1, keypair2.publicKey);

    balance1 = await solanaClient.getBalance(keypair1.publicKey);
    balance2 = await solanaClient.getBalance(keypair2.publicKey);
    assert.equal(balance1, 500_000_000 - costToSend);
    assert.equal(balance2, 500_000_000);
  });

  it('Create token mint.', async () => {
    const cluster: string = 'localnet';
    const solanaClient = new SolanaClient(cluster);

    const mintAuthority: Keypair = solanaClient.generateKeypair();
    await solanaClient.requestAirdrop(2, mintAuthority.publicKey);

    const mintToken: Token = await solanaClient.createMint(mintAuthority, 1_000_000);

    const supply = await solanaClient.getMintSupply(mintToken.publicKey);
    assert.equal(supply, 1_000_000);

    const balance = await solanaClient.getTokenBalance(mintToken, mintAuthority.publicKey);
    assert.equal(balance, 1_000_000);
  });

  it('Send tokens.', async () => {
    const cluster: string = 'localnet';
    const solanaClient = new SolanaClient(cluster);

    const mintAuthority: Keypair = solanaClient.generateKeypair();
    await solanaClient.requestAirdrop(2, mintAuthority.publicKey);

    const mintToken: Token = await solanaClient.createMint(mintAuthority, 1_000_000);

    const user: Keypair = solanaClient.generateKeypair();
    await solanaClient.requestAirdrop(2, user.publicKey);

    await solanaClient.sendToken(500_000, mintToken, mintAuthority, user.publicKey);

    const balance1 = await solanaClient.getTokenBalance(mintToken, mintAuthority.publicKey);
    assert.equal(balance1, 500_000);

    const balance2 = await solanaClient.getTokenBalance(mintToken, user.publicKey);
    assert.equal(balance2, 500_000);
  });

});
