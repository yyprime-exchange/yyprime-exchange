import { Buffer } from 'buffer';
import {
  BN,
} from "@project-serum/anchor";
import {
  DexInstructions,
  Market,
  MARKET_STATE_LAYOUT_V3,
  Orderbook,
  TokenInstructions,
} from "@project-serum/serum";
import {
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Commitment,
  Connection,
  Context,
  KeyedAccountInfo,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';

export interface SerumBook {
  symbol: string;
  market: string;
  baseMint: string;
  baseSymbol: string;
  baseDecimals: number;
  basePrice: string;
  quoteMint: string;
  quoteSymbol: string;
  quoteDecimals: number;
  quotePrice: string;
  requestQueue: string;
  eventQueue: string;
  bids: string;
  asks: string;

  serumMarket: Market | undefined;
  ask: Orderbook | undefined;
  bid: Orderbook | undefined;
}

export class SerumClient {
  commitment: Commitment = 'finalized';
  connection: Connection;
  serumProgram: PublicKey;
  simulation;

  books: Map<string, SerumBook>;
  keyTypes: Map<string, string>;

  onAsk: (book: SerumBook) => void;
  onBid: (book: SerumBook) => void;

  constructor(
    simulation,
    onAsk: (book: SerumBook) => void,
    onBid: (book: SerumBook) => void,
  ) {
    this.connection = new Connection(simulation.config.serum.url);
    this.onAsk = onAsk;
    this.onBid = onBid;
    this.serumProgram = new PublicKey(simulation.config.serum.program);
    this.simulation = simulation;

    this.books = new Map<string, SerumBook>();

    //TODO replace this with a book event wrapper.
    this.keyTypes = new Map<string, string>();

    simulation.markets.forEach((market) => {
      let book: SerumBook = {
        ...market
      };

      this.books.set(market.market, book);
      this.books.set(market.asks, book);
      this.books.set(market.bids, book);

      this.keyTypes.set(market.asks, "asks");
      this.keyTypes.set(market.bids, "bids");
    });
  }

  public async createMarkets(payer: Keypair) {
    this.simulation.markets.forEach(async (market) => {
      this.createMarket(
        market.symbol,
        payer,
        Keypair.fromSecretKey(Buffer.from(market.marketPrivateKey, 'base64')),
        Keypair.fromSecretKey(Buffer.from(market.requestQueuePrivateKey, 'base64')),
        Keypair.fromSecretKey(Buffer.from(market.eventQueuePrivateKey, 'base64')),
        Keypair.fromSecretKey(Buffer.from(market.bidsPrivateKey, 'base64')),
        Keypair.fromSecretKey(Buffer.from(market.asksPrivateKey, 'base64')),
        Keypair.fromSecretKey(Buffer.from(market.baseVaultPrivateKey, 'base64')),
        Keypair.fromSecretKey(Buffer.from(market.quoteVaultPrivateKey, 'base64')),
        new PublicKey(market.baseMint),
        market.baseLotSize,
        new PublicKey(market.quoteMint),
        market.quoteLotSize,
        market.feeRateBps
      );
    });
  }

  public async createMarket(
    symbol: string,
    payer: Keypair,
    market: Keypair,
    requestQueue: Keypair,
    eventQueue: Keypair,
    bids: Keypair,
    asks: Keypair,
    baseVault: Keypair,
    quoteVault: Keypair,
    //marketAuthority: PublicKey,
    //pruneAuthority: PublicKey,
    //crankAuthority: PublicKey,
    baseMint: PublicKey,
    baseLotSize: number,
    quoteMint: PublicKey,
    quoteLotSize: number,
    feeRateBps: number,
  ) {
    console.log(`createMarket(${symbol})`);

    //TODO this should be in the simulation config.
    const quoteDustThreshold = new BN(100);

    const [vaultOwner, vaultSignerNonce] = await this.getVaultOwnerAndNonce(market.publicKey);

    const tx1 = new Transaction();
    tx1.add(
      SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: baseVault.publicKey,
        lamports: await this.connection.getMinimumBalanceForRentExemption(165),
        space: 165,
        programId: TOKEN_PROGRAM_ID,
      }),
      SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
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
        fromPubkey: payer.publicKey,
        newAccountPubkey: market.publicKey,
        lamports: await this.connection.getMinimumBalanceForRentExemption(MARKET_STATE_LAYOUT_V3.span),
        space: MARKET_STATE_LAYOUT_V3.span,
        programId: this.serumProgram,
      }),
      SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: requestQueue.publicKey,
        lamports: await this.connection.getMinimumBalanceForRentExemption(5120 + 12),
        space: 5120 + 12,
        programId: this.serumProgram,
      }),
      SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: eventQueue.publicKey,
        lamports: await this.connection.getMinimumBalanceForRentExemption(262144 + 12),
        space: 262144 + 12,
        programId: this.serumProgram,
      }),
      SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: bids.publicKey,
        lamports: await this.connection.getMinimumBalanceForRentExemption(65536 + 12),
        space: 65536 + 12,
        programId: this.serumProgram,
      }),
      SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
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
        //authority: marketAuthority,
        //pruneAuthority: pruneAuthority,
        //crankAuthority: crankAuthority,
      })
    );

    const transactions = [
      { transaction: tx1, signers: [payer, baseVault, quoteVault] },
      { transaction: tx2, signers: [payer, market, requestQueue, eventQueue, bids, asks],
      },
    ];
    for (let tx of transactions) {
      await sendAndConfirmTransaction(this.connection, tx.transaction, tx.signers);
    }
  }

  private async getVaultOwnerAndNonce(publicKey: PublicKey) {
    const programId: PublicKey = this.serumProgram;
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

  public initialize2(): Promise<void> {
    return (async () => {
      this.simulation.markets.forEach(async (market) => {
        this.books.get(market.market)!.serumMarket = await Market.load(this.connection, new PublicKey(market.market), undefined, this.serumProgram);
      });
    })().then(() => {
      console.log(`Serum initialized.`);
    });
  }

  public subscribe() {
    this.connection.onProgramAccountChange(
      this.serumProgram,
      (keyedAccountInfo: KeyedAccountInfo, context: Context) => {
        const key = keyedAccountInfo.accountId.toBase58();
        let book = this.books.get(key);
        if (book && book.serumMarket) {
          const keyType = this.keyTypes.get(key);
          switch (keyType) {
            case "asks": book.ask = Orderbook.decode(book.serumMarket, keyedAccountInfo.accountInfo.data); this.onAsk(book); break;
            case "bids": book.bid = Orderbook.decode(book.serumMarket, keyedAccountInfo.accountInfo.data); this.onAsk(book); break;
          }
        }
      },
      this.commitment,
    );
  }

}
