import { Keypair } from "@solana/web3.js";

export class SimulationBuilder {
  private bots;
  private cluster: string;
  private markets;
  private tokens;

  constructor(cluster: string) {
    this.bots = [];
    this.cluster = cluster;
    this.markets = [];
    this.tokens = [];
    console.log(`Building simulation on ${cluster}`);
  }

  public token(token: string) {
    this.tokens.push({ symbol: token });
  }

  public market(base: string, quote: string) {
    this.markets.push({ symbol: `${base}/${quote}`, base: base, quote: quote });
  }

  public market_maker(base: string, baseBalance: number, quote: string, quoteBalance: number, params) {
    this.bots.push({ type: 'market_maker', symbol: `${base}/${quote}`, base, baseBalance, quote, quoteBalance, params });
  }

  public random_taker(base: string, baseBalance: number, quote: string, quoteBalance: number, params) {
    this.bots.push({ type: 'random_taker', symbol: `${base}/${quote}`, base, baseBalance, quote, quoteBalance, params });
  }

  public build() {
    const tokens = this.tokens.map(token => {
      const keypair = Keypair.generate();
      return {
        symbol: token.symbol,
        mint: keypair.publicKey.toBase58(),
        mintPrivateKey: keypair.secretKey,
        decimals: 6,
      };
    });
    tokens.push({
      symbol: 'SOL',
      mint: 'So11111111111111111111111111111111111111112',
      mintPrivateKey: new Uint8Array(0),
      decimals: 9,
    });
    tokens.sort((a,b) => (a.symbol > b.symbol ? 1 : -1));


    const tokenKeys: Map<string, string> = new Map();
    tokens.forEach(token => {
      tokenKeys.set(token.symbol, token.mint);
    });


    const markets = this.markets.map(market => {
      const marketKeypair: Keypair = Keypair.generate();
      const requestQueueKeypair: Keypair = Keypair.generate();
      const eventQueueKeypair: Keypair = Keypair.generate();
      const bidsKeypair: Keypair = Keypair.generate();
      const asksKeypair: Keypair = Keypair.generate();

      return {
        "symbol": market.symbol,
        "market": marketKeypair.publicKey.toBase58(),
        "marketPrivateKey": marketKeypair.secretKey,
        "baseMint": tokenKeys.get(market.base),
        "baseSymbol": market.base,
        "baseDecimals": 6,
        "quoteMint": tokenKeys.get(market.quote),
        "quoteSymbol": market.quote,
        "quoteDecimals": 6,
        "requestQueue": requestQueueKeypair.publicKey.toBase58(),
        "requestQueuePrivateKey": requestQueueKeypair.secretKey,
        "eventQueue": eventQueueKeypair.publicKey.toBase58(),
        "eventQueuePrivateKey": eventQueueKeypair.secretKey,
        "bids": bidsKeypair.publicKey.toBase58(),
        "bidsPrivateKey": bidsKeypair.secretKey,
        "asks": asksKeypair.publicKey.toBase58(),
        "asksPrivateKey": asksKeypair.secretKey,
      };
    });


    const bots = this.bots.map(bot => {

      /*
      */

      return bot;
    });

    return {
      cluster: this.cluster,
      tokens: tokens,
      markets: markets,
      //bots: bots,
    }
  }

}
