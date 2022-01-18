import { Buffer } from 'buffer';
import {
  BN,
} from "@project-serum/anchor";
import {
  DexInstructions,
  Market,
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

interface BookEvent {
  event: string;
  book: SerumBook;
}

export class SerumClient {
  commitment: Commitment = 'finalized';
  connection: Connection;
  serumProgram: PublicKey;
  simulation;

  books: Map<string, SerumBook>;
  bookEvents: Map<string, BookEvent>;

  constructor(
    simulation,
  ) {
    this.connection = new Connection(simulation.config.serum.url);
    this.serumProgram = new PublicKey(simulation.config.serum.program);
    this.simulation = simulation;

    this.books = new Map<string, SerumBook>();
    this.bookEvents = new Map<string, BookEvent>();

    simulation.markets.forEach((market) => {
      let book: SerumBook = {
        ...market
      };

      this.books.set(market.market, book);

      this.bookEvents.set(market.asks, { event: "asks", book: book });
      this.bookEvents.set(market.bids, { event: "bids", book: book });
      this.bookEvents.set(market.eventQueue, { event: "eventQueue", book: book });
      this.bookEvents.set(market.requestQueue, { event: "requestQueue", book: book });
    });
  }

  public async createMarkets(payer: Keypair) {
    await Promise.all(
      this.simulation.markets.map(async (market) => {
        await this.createMarket(
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
      })
    );
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

    /*
    connection: provider.connection,
    wallet: provider.wallet,
    baseMint: baseMint,
    quoteMint: quoteMint,
    baseLotSize: 100000,
    quoteLotSize: 100,
    dexProgramId: DEX_PID,
    feeRateBps: 0,
    */

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
        lamports: await this.connection.getMinimumBalanceForRentExemption(Market.getLayout(this.serumProgram).span),
        space: Market.getLayout(this.serumProgram).span,
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
      { transaction: tx2, signers: [payer, market, requestQueue, eventQueue, bids, asks] },
    ];
    for (let tx of transactions) {
      tx.transaction.feePayer = payer.publicKey;
      await sendAndConfirmTransaction(this.connection, tx.transaction, tx.signers);
    }
  }

  public getMarket(market: string) {
    return this.books.get(market)!.serumMarket!;
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

  public async initialize() {
    await Promise.all(
      this.simulation.markets.map(async (market) => {
        this.books.get(market.market)!.serumMarket = await Market.load(this.connection, new PublicKey(market.market), { commitment: "processed" }, this.serumProgram);
      })
    );
  }

  public subscribe(
    onAsk: (book: SerumBook) => void,
    onBid: (book: SerumBook) => void,
    onEvent: (book: SerumBook) => void,
    onRequest: (book: SerumBook) => void,
  ) {
    this.connection.onProgramAccountChange(
      this.serumProgram,
      (keyedAccountInfo: KeyedAccountInfo, context: Context) => {
        const key = keyedAccountInfo.accountId.toBase58();
        const bookEvent = this.bookEvents.get(key);
        if (bookEvent && bookEvent.book.serumMarket) {
          switch (bookEvent.event) {
            case "asks": bookEvent.book.ask = Orderbook.decode(bookEvent.book.serumMarket, keyedAccountInfo.accountInfo.data); onAsk(bookEvent.book); break;
            case "bids": bookEvent.book.bid = Orderbook.decode(bookEvent.book.serumMarket, keyedAccountInfo.accountInfo.data); onBid(bookEvent.book); break;
            case "eventQueue": bookEvent.book.bid = Orderbook.decode(bookEvent.book.serumMarket, keyedAccountInfo.accountInfo.data); onEvent(bookEvent.book); break;
            case "requestQueue": bookEvent.book.bid = Orderbook.decode(bookEvent.book.serumMarket, keyedAccountInfo.accountInfo.data); onRequest(bookEvent.book); break;
            default: throw new Error(`Invalid key type: ${bookEvent.event}`);
          }
        }
      },
      this.commitment,
    );
  }

}
