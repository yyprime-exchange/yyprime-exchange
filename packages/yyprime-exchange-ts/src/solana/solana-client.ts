import {
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

import SOLANA_CLUSTERS from './clusters.json';

export class SolanaClient {

  cluster: string;
  commitment: Commitment = 'confirmed';
  connection: Connection;

  constructor(cluster: string) {
    this.cluster = cluster;

    if (SOLANA_CLUSTERS[cluster].https) {
      this.connection = new Connection(SOLANA_CLUSTERS[cluster].https);
    } else if (SOLANA_CLUSTERS[cluster].http) {
      this.connection = new Connection(SOLANA_CLUSTERS[cluster].http);
    } else {
      throw new Error("Cluster url is not defined.");
    }
  }

  //TODO
  /*
connection.onAccountChange(
  wallet.publicKey(),
  ( updatedAccountInfo, context ) => console.log( 'Updated account info: ', updatedAccountInfo ),
  'confirmed',
);
  */

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

  public async createMint(mintAuthority: Keypair, amount: number) {
    const decimals = 9;
    const payer: Signer = mintAuthority;
    const mintToken: Token = await Token.createMint(
      this.connection,
      payer,
      mintAuthority.publicKey,
      null,
      decimals,
      TOKEN_PROGRAM_ID
    );

    //TODO
    /*
let tx = new Transaction().add(
  // create mint account
  SystemProgram.createAccount({
    fromPubkey: feePayer.publicKey,
    newAccountPubkey: mint.publicKey,
    space: MintLayout.span,
    lamports: await Token.getMinBalanceRentForExemptMint(connection),
    programId: TOKEN_PROGRAM_ID,
  }),
  // init mint account
  Token.createInitMintInstruction(
    TOKEN_PROGRAM_ID, // always TOKEN_PROGRAM_ID
    mint.publicKey, // mint pubkey
    8, // decimals
    alice.publicKey, // mint authority
    alice.publicKey // freeze authority (if you don't need it, you can set `null`)
  )
);
console.log(`txhash: ${await connection.sendTransaction(tx, [feePayer, mint])}`);
    */

    const tokenAccount = await mintToken.getOrCreateAssociatedAccountInfo(mintAuthority.publicKey);
    await mintToken.mintTo(tokenAccount.address, mintAuthority.publicKey, [], amount * LAMPORTS_PER_SOL);
    return mintToken;
  }

  public async getBalance(publicKey: PublicKey) {
    return this.connection.getBalance(publicKey, this.commitment);
  }

  public async getMintSupply(mintPublicKey: PublicKey) {
    //console.log(JSON.stringify(await this.connection.getParsedAccountInfo(mintPublicKey)));
    const mintAccount = await this.connection.getAccountInfo(mintPublicKey);
    const mintInfo = MintLayout.decode(Buffer.from(mintAccount!.data));
    const supply = u64.fromBuffer(mintInfo.supply);
    return supply.toNumber() / LAMPORTS_PER_SOL;
  }

  public async getTokenAccountsByOwner(owner: PublicKey) {
    const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_PROGRAM_ID });
    return tokenAccounts;
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

  //TODO
  /*
// calculate ATA
let ata = await Token.getAssociatedTokenAddress(
  ASSOCIATED_TOKEN_PROGRAM_ID, // always ASSOCIATED_TOKEN_PROGRAM_ID
  TOKEN_PROGRAM_ID, // always TOKEN_PROGRAM_ID
  mintPubkey, // mint
  alice.publicKey // owner
);
console.log(`ATA: ${ata.toBase58()}`);

let tx = new Transaction().add(
  Token.createAssociatedTokenAccountInstruction(
    ASSOCIATED_TOKEN_PROGRAM_ID, // always ASSOCIATED_TOKEN_PROGRAM_ID
    TOKEN_PROGRAM_ID, // always TOKEN_PROGRAM_ID
    mintPubkey, // mint
    ata, // ata
    alice.publicKey, // owner of token account
    feePayer.publicKey // fee payer
  )
);
console.log(`txhash: ${await connection.sendTransaction(tx, [feePayer])}`);
  */

}
