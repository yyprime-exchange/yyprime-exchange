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
  Signer,
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

  public async createFaucet(payer: Keypair, mint: Keypair, decimals: number, faucet: Keypair, amount: number) {
    let transaction = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: mint.publicKey,
        space: MintLayout.span,
        lamports: await Token.getMinBalanceRentForExemptMint(this.connection),
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

    const associatedTokenAddress = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mint.publicKey,
      faucet.publicKey,
    );

    transaction = new Transaction().add(
      Token.createAssociatedTokenAccountInstruction(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        mint.publicKey,
        associatedTokenAddress,
        faucet.publicKey,
        payer.publicKey
      )
    );
    await sendAndConfirmTransaction(this.connection, transaction, [payer]);

    transaction = new Transaction().add(
      Token.createMintToInstruction(
        TOKEN_PROGRAM_ID,
        mint.publicKey,
        associatedTokenAddress,
        faucet.publicKey,
        [],
        amount * this.pow10(decimals)
      )
    );
    await sendAndConfirmTransaction(this.connection, transaction, [payer, faucet]);
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

  public async getTokenAccountsByOwner(owner: PublicKey) {
    return await this.connection.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_PROGRAM_ID });
  }

  public async getTokenBalance(mintToken: Token, owner: PublicKey) {
    const tokenAccount = await mintToken.getOrCreateAssociatedAccountInfo(owner); // TODO Get
    const balance = await this.connection.getTokenAccountBalance(tokenAccount.address, this.commitment);
    return balance.value.uiAmount;
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
    const payer = from;
    await sendAndConfirmTransaction(this.connection, transaction, [payer]);
  }

  public async sendToken(amount: number, mintToken: Token, from: Keypair, to: PublicKey) {
    const decimals = 9;
    const toTokenAccount = await mintToken.getOrCreateAssociatedAccountInfo(to); // TODO Get
    const fromTokenAccount = await mintToken.getOrCreateAssociatedAccountInfo(from.publicKey); // TODO GetOrCreate
    const transaction = new Transaction()
    .add(Token.createTransferCheckedInstruction(
      TOKEN_PROGRAM_ID,
      fromTokenAccount.address,
      mintToken.publicKey,
      toTokenAccount.address,
      from.publicKey,
      [],
      amount * LAMPORTS_PER_SOL,
      decimals
    ));
    const payer = from;
    await sendAndConfirmTransaction(this.connection, transaction, [payer]);
  }

  private pow10(decimals: number): number {
    switch(decimals) {
      case 6: return 1_000_000;
      case 9: return 1_000_000_000;
      default: throw new Error("Unsupported number of decimals.");
    }
  }

}
