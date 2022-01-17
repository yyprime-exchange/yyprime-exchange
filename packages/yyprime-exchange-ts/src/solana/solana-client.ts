import { Buffer } from 'buffer';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  MintLayout,
  Token,
  TOKEN_PROGRAM_ID,
  u64,
} from "@solana/spl-token";
import {
  Commitment,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';

export class SolanaClient {
  commitment: Commitment = 'finalized';
  connection: Connection;
  simulation;

  constructor(
    simulation,
  ) {
    if (simulation.config.solana.https) {
      this.connection = new Connection(simulation.config.solana.https);
    } else if (simulation.config.solana.http) {
      this.connection = new Connection(simulation.config.solana.http);
    } else {
      throw new Error("Endpoint is not defined.");
    }
    this.simulation = simulation;
  }

  public async costToSend(sol: number, fromKeypair: Keypair, toPublicKey: PublicKey) {
    const recentBlockhash = await this.connection.getRecentBlockhash();
    const transaction = new Transaction({ recentBlockhash: recentBlockhash.blockhash })
    .add(SystemProgram.transfer({
      fromPubkey: fromKeypair.publicKey,
      toPubkey: toPublicKey,
      lamports: sol * LAMPORTS_PER_SOL
    }));
    transaction.sign(fromKeypair);
    return transaction.signatures.length * recentBlockhash.feeCalculator.lamportsPerSignature;
  }

  public async createFaucets(payer: Keypair) {
    for (const token of this.simulation.tokens) {
      //if (token.symbol !== 'SOL') {
        const mint: Keypair = Keypair.fromSecretKey(Buffer.from(token.mintPrivateKey, 'base64'));

        const faucet: Keypair = Keypair.fromSecretKey(Buffer.from(token.faucetPrivateKey, 'base64'));
        //TODO I don't like to do this here.
        await this.requestAirdrop(1, faucet.publicKey);

        const mintSupply = 1_000_000; //TODO this should be in the simulation config.
        await this.createMint(token.symbol, payer, mint, token.decimals, faucet, mintSupply);
      //}
    }
  }

  private async createMint(symbol: string, payer: Keypair, mint: Keypair, decimals: number, faucet: Keypair, amount: number) {
    console.log(`createMint(${symbol})`);

    let transaction = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: mint.publicKey,
        space: MintLayout.span,
        lamports: await this.connection.getMinimumBalanceForRentExemption(MintLayout.span),
        programId: TOKEN_PROGRAM_ID,
      }),
      Token.createInitMintInstruction(
        TOKEN_PROGRAM_ID,
        mint.publicKey,
        decimals,
        faucet.publicKey, // mintAuthority
        null,
      )
    );
    await sendAndConfirmTransaction(this.connection, transaction, [payer, mint]);

    await this.createTokenAccount(mint.publicKey, faucet.publicKey, payer);

    const tokenAddress = await this.getAssociatedTokenAddress(mint.publicKey, faucet.publicKey);

    transaction = new Transaction().add(
      Token.createMintToInstruction(
        TOKEN_PROGRAM_ID,
        mint.publicKey,
        tokenAddress,
        faucet.publicKey, // mintAuthority
        [],
        amount * this.pow10(decimals)
      )
    );
    await sendAndConfirmTransaction(this.connection, transaction, [payer, faucet]);
  }

  public async createTokenAccount(mint: PublicKey, owner: PublicKey, payer: Keypair) {
    const tokenAddress = await this.getAssociatedTokenAddress(mint, owner);

    const transaction = new Transaction().add(
      Token.createAssociatedTokenAccountInstruction(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        mint,
        tokenAddress,
        owner,
        payer.publicKey
      )
    );
    await sendAndConfirmTransaction(this.connection, transaction, [payer]);
  }

  public async getAssociatedTokenAddress(mint: PublicKey, owner: PublicKey) {
    return await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mint,
      owner,
    );
  }

  public async getBalance(publicKey: PublicKey) {
    return await this.connection.getBalance(publicKey, this.commitment);
  }

  public async getMintSupply(mintPublicKey: PublicKey, decimals: number) {
    //console.log(JSON.stringify(await this.connection.getParsedAccountInfo(mintPublicKey)));
    const mintAccount = await this.connection.getAccountInfo(mintPublicKey);
    const mintInfo = MintLayout.decode(Buffer.from(mintAccount!.data));
    const supply = u64.fromBuffer(mintInfo.supply);
    return supply.toNumber() / this.pow10(decimals);
  }

  public async getTokenBalance(mint: PublicKey, owner: PublicKey) {
    const tokenAddress = await this.getAssociatedTokenAddress(mint, owner);
    const balance = await this.connection.getTokenAccountBalance(tokenAddress, this.commitment);
    return balance.value.uiAmount;
  }

  private pow10(decimals: number): number {
    switch(decimals) {
      case 6: return 1_000_000;
      case 9: return 1_000_000_000;
      default: throw new Error("Unsupported number of decimals.");
    }
  }

  public async requestAirdrop(sol: number, publicKey: PublicKey) {
    const airdropSignature = await this.connection.requestAirdrop(publicKey, sol * LAMPORTS_PER_SOL);
    await this.connection.confirmTransaction(airdropSignature);
  }

  public async send(sol: number, from: Keypair, to: PublicKey) {
    const transaction = new Transaction()
    .add(SystemProgram.transfer({
      fromPubkey: from.publicKey,
      toPubkey: to,
      lamports: sol * LAMPORTS_PER_SOL
    }));
    await sendAndConfirmTransaction(this.connection, transaction, [from]);
  }

  public async sendToken(mint: PublicKey, amount: number, decimals: number, from: Keypair, to: PublicKey, payer: Keypair) {
    const transaction = new Transaction()
    .add(Token.createTransferCheckedInstruction(
      TOKEN_PROGRAM_ID,
      await this.getAssociatedTokenAddress(mint, from.publicKey),
      mint,
      await this.getAssociatedTokenAddress(mint, to),
      from.publicKey,
      [],
      amount * this.pow10(decimals),
      decimals
    ));
    await sendAndConfirmTransaction(this.connection, transaction, [payer, from]);
  }

}
