import { Buffer } from 'buffer';
import { BN } from "@project-serum/anchor";
import {
  decodeEventQueue,
  DexInstructions,
  Market,
  TokenInstructions,
} from "@project-serum/serum";
import {
  ORDERBOOK_LAYOUT,
} from "@project-serum/serum/lib/market";
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
  baseLotSize: number;
  baseDecimals: number;
  basePrice: string;
  quoteMint: string;
  quoteSymbol: string;
  quoteLotSize: number;
  quoteDecimals: number;
  quotePrice: string;
  requestQueue: string;
  eventQueue: string;
  bids: string;
  asks: string;

  serumMarket: Market | undefined;
  ask: [number, number, BN, BN][] | undefined;
  bid: [number, number, BN, BN][] | undefined;
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
  booksByBaseMint: Map<string, SerumBook>;
  bookEvents: Map<string, BookEvent>;

  constructor(
    simulation,
  ) {
    this.connection = new Connection(simulation.config.serum.url, "processed");
    this.serumProgram = new PublicKey(simulation.config.serum.program);
    this.simulation = simulation;

    this.books = new Map<string, SerumBook>();
    this.booksByBaseMint = new Map<string, SerumBook>();
    this.bookEvents = new Map<string, BookEvent>();

    simulation.markets.forEach((market) => {
      let book: SerumBook = {
        ...market
      };

      this.books.set(market.market, book);
      this.booksByBaseMint.set(market.baseMint, book);

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
          market.quoteDustThreshold,
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
    quoteDustThreshold: number,
    feeRateBps: number,
  ) {
    console.log(`createMarket(${symbol})`);

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
        quoteDustThreshold: new BN(quoteDustThreshold),
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
        this.books.get(market.market)!.serumMarket = await Market.load(this.connection, new PublicKey(market.market), { skipPreflight: true, commitment: "processed" as Commitment }, this.serumProgram);
      })
    );
  }

  public async subscribe(
    onAsk: ((book: SerumBook) => void) | null,
    onBid: ((book: SerumBook) => void) | null,
    onEvent: ((book: SerumBook, events) => void) | null,
  ) {
    await Promise.all(
      this.simulation.markets.map(async (market) => {
        const book: SerumBook = this.books.get(market.market)!;
        const depth = 20; //TODO make this configurable.
        book.ask = toPriceLevels((await this.connection.getAccountInfo(new PublicKey(market.asks), this.commitment))!.data, depth, book.baseLotSize, book.baseDecimals, book.quoteLotSize, book.quoteDecimals);
        book.bid = toPriceLevels((await this.connection.getAccountInfo(new PublicKey(market.bids), this.commitment))!.data, depth, book.baseLotSize, book.baseDecimals, book.quoteLotSize, book.quoteDecimals);
      })
    );
    this.connection.onProgramAccountChange(
      this.serumProgram,
      (keyedAccountInfo: KeyedAccountInfo, context: Context) => {
        const key = keyedAccountInfo.accountId.toBase58();
        const bookEvent = this.bookEvents.get(key);
        if (bookEvent && bookEvent.book.serumMarket) {
          const depth = 20; //TODO make this configurable.
          switch (bookEvent.event) {
            case "asks": bookEvent.book.ask = toPriceLevels(keyedAccountInfo.accountInfo.data, depth, bookEvent.book.baseLotSize, bookEvent.book.baseDecimals, bookEvent.book.quoteLotSize, bookEvent.book.quoteDecimals); if (onAsk) onAsk(bookEvent.book); break;
            case "bids": bookEvent.book.bid = toPriceLevels(keyedAccountInfo.accountInfo.data, depth, bookEvent.book.baseLotSize, bookEvent.book.baseDecimals, bookEvent.book.quoteLotSize, bookEvent.book.quoteDecimals); if (onBid) onBid(bookEvent.book); break;
            case "eventQueue": if (onEvent) onEvent(bookEvent.book, decodeEventQueue(keyedAccountInfo.accountInfo.data)); break;
          }
        }
      },
      this.commitment,
    );
  }

  public static async query(connection: Connection, serumProgram: PublicKey) {
    const programAccounts = await connection.getProgramAccounts(serumProgram, { filters: [ { dataSize: Market.getLayout(serumProgram).span } ] });
    return await Promise.all(
      programAccounts.map(account => {
        return Market.getLayout(serumProgram).decode(account.account.data);
      }).filter(market => { return market !== undefined; })
    );
  }
}

export function toPriceLevels(data, depth: number, baseLotSize: number, baseDecimals: number, quoteLotSize: number, quoteDecimals: number): [number, number, BN, BN][] {
  const { accountFlags, slab } = decodeOrderBook(data);
  const descending = accountFlags.bids;
  const levels: [BN, BN][] = []; // (price, size)
  for (const { key, quantity } of slab.items(descending)) {
    const price = key.ushrn(64);
    if (levels.length > 0 && levels[levels.length - 1][0].eq(price)) {
      levels[levels.length - 1][1].iadd(quantity);
    } else {
      levels.push([price, quantity]);
    }
  }
  return levels.slice(0, 7).map(([priceLots, sizeLots]) => [
    priceLotsToNumber(priceLots, new BN(baseLotSize), baseDecimals, new BN(quoteLotSize), quoteDecimals),
    baseSizeLotsToNumber(sizeLots, new BN(baseLotSize), baseDecimals),
    priceLots,
    sizeLots,
  ]);
}

function decodeOrderBook(buffer) {
  const { accountFlags, slab } = ORDERBOOK_LAYOUT.decode(buffer);
  return { accountFlags: accountFlags, slab: slab };
}

export function priceLotsToNumber(price: BN, baseLotSize: BN, baseSplTokenDecimals: number, quoteLotSize: BN, quoteSplTokenDecimals: number) {
  return divideBnToNumber(price.mul(quoteLotSize).mul(baseSplTokenMultiplier(baseSplTokenDecimals)), baseLotSize.mul(quoteSplTokenMultiplier(quoteSplTokenDecimals)));
}

export function baseSizeLotsToNumber(size: BN, baseLotSize: BN, baseSplTokenDecimals: number) {
  return divideBnToNumber(size.mul(baseLotSize), baseSplTokenMultiplier(baseSplTokenDecimals));
}

function divideBnToNumber(numerator: BN, denominator: BN): number {
  const quotient = numerator.div(denominator).toNumber();
  const rem = numerator.umod(denominator);
  const gcd = rem.gcd(denominator);
  return quotient + rem.div(gcd).toNumber() / denominator.div(gcd).toNumber();
}

function baseSplTokenMultiplier(baseSplTokenDecimals: number) {
  return new BN(10).pow(new BN(baseSplTokenDecimals));
}

function quoteSplTokenMultiplier(quoteSplTokenDecimals: number) {
  return new BN(10).pow(new BN(quoteSplTokenDecimals));
}
