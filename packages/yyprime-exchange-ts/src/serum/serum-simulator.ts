import {
  BN,
  Provider,
  Wallet,
} from "@project-serum/anchor";
import {
  createMintAndVault,
} from "@project-serum/common";
import {
  DexInstructions,
  MARKET_STATE_LAYOUT_V3,
  TokenInstructions,
} from "@project-serum/serum";
import {
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Commitment,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

import SERUM_PROGRAMS from './programs.json';

export type SimulatorCluster = 'localnet' | 'devnet' | 'testnet';

export class SerumSimulator {
  cluster: string;
  commitment: Commitment = 'finalized';
  connection: Connection;
  provider: Provider;
  serumProgram: PublicKey;
  tokens: {}[];

  keypair: Keypair;
  wallet: Wallet;

  constructor(cluster: string) {
    this.cluster = cluster;
    this.connection = new Connection(SERUM_PROGRAMS[cluster].url);

    this.keypair = Keypair.generate();
    this.wallet = new Wallet(this.keypair);

    this.provider = new Provider(this.connection, this.wallet, Provider.defaultOptions());
    this.serumProgram = new PublicKey(SERUM_PROGRAMS[cluster].program);
    this.tokens = [];
  }

  public async initialize() {
    const sol = 2;
    const airdropSignature = await this.connection.requestAirdrop(this.keypair.publicKey, sol * LAMPORTS_PER_SOL);
    await this.connection.confirmTransaction(airdropSignature);
  }

  public async createTokens(count: number) {
    const DECIMALS = 6;

    for (let tokenIndex = 0; tokenIndex < count; tokenIndex += 1) {
      const symbol = "TK" + tokenIndex;
      const authority: Keypair = Keypair.generate();
      const [mint, vault] = await createMintAndVault(
        this.provider,
        new BN("1000000000000000000"),
        undefined,
        DECIMALS
      );
      this.tokens.push({ symbol, decimals: DECIMALS, authority, mint, vault });
    }
  }

  public async createMarket(
    marketAuthority: PublicKey,
    pruneAuthority: PublicKey,
    crankAuthority: PublicKey,
    baseMint: PublicKey,
    baseLotSize: number,
    quoteMint: PublicKey,
    quoteLotSize: number,
    feeRateBps: number,
  ) {
    const market: Keypair = Keypair.generate();
    const requestQueue: Keypair = Keypair.generate();
    const eventQueue: Keypair = Keypair.generate();
    const bids: Keypair = Keypair.generate();
    const asks: Keypair = Keypair.generate();
    const baseVault: Keypair = Keypair.generate();
    const quoteVault: Keypair = Keypair.generate();
    const quoteDustThreshold = new BN(100);

    const [vaultOwner, vaultSignerNonce] = await this.getVaultOwnerAndNonce(
      market.publicKey,
      this.serumProgram
    );

    const tx1 = new Transaction();
    tx1.add(
      SystemProgram.createAccount({
        fromPubkey: this.wallet.publicKey,
        newAccountPubkey: baseVault.publicKey,
        lamports: await this.connection.getMinimumBalanceForRentExemption(165),
        space: 165,
        programId: TOKEN_PROGRAM_ID,
      }),
      SystemProgram.createAccount({
        fromPubkey: this.wallet.publicKey,
        newAccountPubkey: quoteVault.publicKey,
        lamports: await this.connection.getMinimumBalanceForRentExemption(165),
        space: 165,
        programId: TOKEN_PROGRAM_ID,
      }),
      TokenInstructions.initializeAccount({
        account: baseVault.publicKey,
        mint: baseMint,
        owner: vaultOwner,
      }),
      TokenInstructions.initializeAccount({
        account: quoteVault.publicKey,
        mint: quoteMint,
        owner: vaultOwner,
      })
    );

    const tx2 = new Transaction();
    tx2.add(
      SystemProgram.createAccount({
        fromPubkey: this.wallet.publicKey,
        newAccountPubkey: market.publicKey,
        lamports: await this.connection.getMinimumBalanceForRentExemption(
          MARKET_STATE_LAYOUT_V3.span
        ),
        space: MARKET_STATE_LAYOUT_V3.span,
        programId: this.serumProgram,
      }),
      SystemProgram.createAccount({
        fromPubkey: this.wallet.publicKey,
        newAccountPubkey: requestQueue.publicKey,
        lamports: await this.connection.getMinimumBalanceForRentExemption(5120 + 12),
        space: 5120 + 12,
        programId: this.serumProgram,
      }),
      SystemProgram.createAccount({
        fromPubkey: this.wallet.publicKey,
        newAccountPubkey: eventQueue.publicKey,
        lamports: await this.connection.getMinimumBalanceForRentExemption(262144 + 12),
        space: 262144 + 12,
        programId: this.serumProgram,
      }),
      SystemProgram.createAccount({
        fromPubkey: this.wallet.publicKey,
        newAccountPubkey: bids.publicKey,
        lamports: await this.connection.getMinimumBalanceForRentExemption(65536 + 12),
        space: 65536 + 12,
        programId: this.serumProgram,
      }),
      SystemProgram.createAccount({
        fromPubkey: this.wallet.publicKey,
        newAccountPubkey: asks.publicKey,
        lamports: await this.connection.getMinimumBalanceForRentExemption(65536 + 12),
        space: 65536 + 12,
        programId: this.serumProgram,
      }),
      DexInstructions.initializeMarket({
        market: market.publicKey,
        requestQueue: requestQueue.publicKey,
        eventQueue: eventQueue.publicKey,
        bids: bids.publicKey,
        asks: asks.publicKey,
        baseVault: baseVault.publicKey,
        quoteVault: quoteVault.publicKey,
        baseMint,
        quoteMint,
        baseLotSize: new BN(baseLotSize),
        quoteLotSize: new BN(quoteLotSize),
        feeRateBps,
        vaultSignerNonce,
        quoteDustThreshold,
        programId: this.serumProgram,
        authority: marketAuthority,
        pruneAuthority: pruneAuthority,
        crankAuthority: crankAuthority,
      })
    );

    const transactions = [
      { transaction: tx1, signers: [baseVault, quoteVault] },
      { transaction: tx2, signers: [market, requestQueue, eventQueue, bids, asks] }
    ];
    for (let tx of transactions) {
      await this.provider.send(tx.transaction, tx.signers);
    }
    const acc = await this.connection.getAccountInfo(market.publicKey);

    //TODO
    console.log(`market.publicKey = ${market.publicKey}`);
    console.log(`vaultOwner.publicKey = ${vaultOwner}`);


  }

  private async getVaultOwnerAndNonce(publicKey: PublicKey, programId: PublicKey) {
    const nonce = new BN(0);
    while (nonce.toNumber() < 255) {
      try {
        const vaultOwner = await PublicKey.createProgramAddress(
          [publicKey.toBuffer(), nonce.toArrayLike(Buffer, "le", 8)],
          programId
        );
        return [vaultOwner, nonce];
      } catch (e) {
        nonce.iaddn(1);
      }
    }
    throw new Error("Unable to find nonce");
  }

}
