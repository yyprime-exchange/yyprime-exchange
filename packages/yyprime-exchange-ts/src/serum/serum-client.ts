import {
  Commitment,
  Connection,
  Context,
  GetProgramAccountsConfig,
  KeyedAccountInfo,
  PublicKey,
} from '@solana/web3.js';
import {
  Market,
  MARKET_STATE_LAYOUT_V3,
  Orderbook,
} from '@project-serum/serum';

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

  public initialize(): void {
    (async () => {
      await this.simulation.markets.forEach(async (market) => {
        this.books.get(market.market)!.serumMarket = await Market.load(this.connection, new PublicKey(market.market), undefined, this.serumProgram);
      });
    })();
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
