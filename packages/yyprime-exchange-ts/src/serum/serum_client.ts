import {
  Commitment,
  Connection,
  Context,
  GetProgramAccountsConfig,
  KeyedAccountInfo,
  PublicKey,
} from '@solana/web3.js';
import {
  MARKET_STATE_LAYOUT_V3,
} from "@project-serum/serum";

import SERUM_MARKETS from './markets.json';
import SERUM_PROGRAMS from './programs.json';
import SOLANA_TOKENS from '../solana/tokens.json';

export interface Market {
  symbol: string;
  market: string;
  baseMint: string;
  baseSymbol: string;
  baseDecimals: number;
  quoteMint: string;
  quoteSymbol: string;
  quoteDecimals: number;
  requestQueue: string;
  eventQueue: string;
  bids: string;
  asks: string;
}

export class SerumClient {
  cluster: string;
  commitment: Commitment = 'finalized';
  connection: Connection;
  serumProgram: PublicKey;

  keyTypes: Map<string, string>;

  markets: Map<string, Market>;
  marketsByAsks: Map<string, Market>;
  marketsByBids: Map<string, Market>;
  marketsByEventQueue: Map<string, Market>;
  marketsByRequestQueue: Map<string, Market>;

  constructor(cluster: string) {
    this.cluster = cluster;
    this.connection = new Connection(SERUM_PROGRAMS[cluster].url);
    this.serumProgram = new PublicKey(SERUM_PROGRAMS[cluster].program);

    this.keyTypes = new Map<string, string>();

    this.markets = new Map<string, Market>();
    this.marketsByAsks = new Map<string, Market>();
    this.marketsByBids = new Map<string, Market>();
    this.marketsByEventQueue = new Map<string, Market>();
    this.marketsByRequestQueue = new Map<string, Market>();

    SERUM_MARKETS[cluster].forEach(market => {
      this.markets.set(market.market, market);
      this.keyTypes.set(market.market, "market");

      this.marketsByAsks.set(market.asks, market);
      this.keyTypes.set(market.asks, "asks");

      this.marketsByBids.set(market.bids, market);
      this.keyTypes.set(market.bids, "bids");

      this.marketsByEventQueue.set(market.eventQueue, market);
      this.keyTypes.set(market.eventQueue, "eventQueue");

      this.marketsByRequestQueue.set(market.requestQueue, market);
      this.keyTypes.set(market.requestQueue, "requestQueue");
    });
  }

  public onMarket(market) {
    //console.log(JSON.stringify(market));
  }

  public async processAsks(key: PublicKey, data) {
    //console.log("ASK " + this.marketsByAsks.get(key.toBase58())?.symbol);
  }

  public async processBids(key: PublicKey, data) {
    //console.log("BID " + this.marketsByBids.get(key.toBase58())?.symbol);
  }

  public async processEventQueue(key: PublicKey, data) {
    //console.log("EVENT_QUEUE " + this.marketsByEventQueue.get(key.toBase58())?.symbol);
  }

  public async processMarket(key: PublicKey, data) {
    const decoded = MARKET_STATE_LAYOUT_V3.decode(data);
    const market = {
      market: new PublicKey(decoded.ownAddress).toBase58(),
      baseMint: new PublicKey(decoded.baseMint).toBase58(),
      quoteMint: new PublicKey(decoded.quoteMint).toBase58(),
      requestQueue: new PublicKey(decoded.requestQueue).toBase58(),
      eventQueue: new PublicKey(decoded.eventQueue).toBase58(),
      bids: new PublicKey(decoded.bids).toBase58(),
      asks: new PublicKey(decoded.asks).toBase58(),
      accountFlags: decoded.accountFlags
    };
    if (this.markets.has(market.market)) {
      this.onMarket(market);
    }
  }

  public async processRequestQueue(key: PublicKey, data) {
    //console.log("REQUEST_QUEUE " + this.marketsByRequestQueue.get(key.toBase58())?.symbol);
  }

  public async subscribe() {
    (await this.connection.getProgramAccounts(this.serumProgram, {
      commitment: this.commitment,
      filters: [ { dataSize: MARKET_STATE_LAYOUT_V3.span } ],
    } as GetProgramAccountsConfig)).forEach(account => {
      this.processMarket(account.pubkey, account.account.data);
    });

    this.connection.onProgramAccountChange(
      this.serumProgram,
      (keyedAccountInfo: KeyedAccountInfo, context: Context) => {
        const key = keyedAccountInfo.accountId.toBase58();
        const keyType = this.keyTypes.get(key);
        switch (keyType) {
          case "asks": this.processAsks(keyedAccountInfo.accountId, keyedAccountInfo.accountInfo.data); break;
          case "bids": this.processBids(keyedAccountInfo.accountId, keyedAccountInfo.accountInfo.data); break;
          case "eventQueue": this.processEventQueue(keyedAccountInfo.accountId, keyedAccountInfo.accountInfo.data); break;
          case "markets": this.processMarket(keyedAccountInfo.accountId, keyedAccountInfo.accountInfo.data); break;
          case "requestQueue": this.processRequestQueue(keyedAccountInfo.accountId, keyedAccountInfo.accountInfo.data); break;
        }
      },
      this.commitment,
    );
  }

}
