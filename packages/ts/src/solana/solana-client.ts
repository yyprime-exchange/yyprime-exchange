import BN from 'bn.js';
import { Buffer } from 'buffer';
import {
  TokenInstructions,
} from '@project-serum/serum';
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
    return tokenAddress;
  }

  public async createTokens(owner: Keypair) {
    await Promise.all(
      this.simulation.tokens.map(async (token) => {
        //if (token.symbol !== 'SOL') {
          console.log(`createMintAndVault(${token.symbol})`);

          const supply = Math.max(token.supply, 1_000_000); //TODO replace this with native SOL.

          const mint: Keypair = Keypair.fromSecretKey(Buffer.from(token.mintPrivateKey, 'base64'));
          const vault: Keypair = Keypair.fromSecretKey(Buffer.from(token.vaultPrivateKey, 'base64'));

          await this.createToken(owner, mint, token.decimals, vault, supply);
        //}
      })
    );
  }

  public async createToken(owner: Keypair, mint: Keypair, decimals: number, vault: Keypair, supply: number) {
    let transaction = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: owner.publicKey,
        newAccountPubkey: mint.publicKey,
        space: 82,
        lamports: await this.connection.getMinimumBalanceForRentExemption(82),
        programId: TokenInstructions.TOKEN_PROGRAM_ID,
      }),
      TokenInstructions.initializeMint({
        mint: mint.publicKey,
        decimals: decimals,
        mintAuthority: owner.publicKey,
      }),
      SystemProgram.createAccount({
        fromPubkey: owner.publicKey,
        newAccountPubkey: vault.publicKey,
        space: 165,
        lamports: await this.connection.getMinimumBalanceForRentExemption(165),
        programId: TokenInstructions.TOKEN_PROGRAM_ID,
      }),
      TokenInstructions.initializeAccount({
        account: vault.publicKey,
        mint: mint.publicKey,
        owner: owner.publicKey,
      }),
      TokenInstructions.mintTo({
        mint: mint.publicKey,
        destination: vault.publicKey,
        amount: new BN(supply * this.pow10(decimals)),
        mintAuthority: owner.publicKey,
      }),
    );
    await sendAndConfirmTransaction(this.connection, transaction, [owner, mint, vault]);
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

  public async getTokenBalance(tokenAddress: PublicKey) {
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

  public async sendToken(mint: PublicKey, amount: number, decimals: number, owner: Keypair, fromTokenAccount: PublicKey, toTokenAccount: PublicKey) {
    const transaction = new Transaction().add(
      Token.createTransferCheckedInstruction(
        TOKEN_PROGRAM_ID,
        fromTokenAccount,
        mint,
        toTokenAccount,
        owner.publicKey,
        [],
        amount * this.pow10(decimals),
        decimals
      )
    );
    await sendAndConfirmTransaction(this.connection, transaction, [owner]);
  }

  public static async query(connection: Connection, tokens) {
    return await Promise.all(
      tokens.map(async (token) => {
        return { symbol: token.symbol, mint: token.mint, data: (await connection.getParsedAccountInfo(token.mint)).value };
      })
    );
  }

}
