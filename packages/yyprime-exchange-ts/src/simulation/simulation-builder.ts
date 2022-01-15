import assert from 'assert';
import { Keypair } from "@solana/web3.js";

import PYTH_PRODUCTS from '../pyth/products.json';
import PYTH_PROGRAMS from '../pyth/programs.json';
import SERUM_MARKETS from '../serum/markets.json';
import SERUM_PROGRAMS from '../serum/programs.json';
import SOLANA_CLUSTERS from '../solana/clusters.json';
import SOLANA_TOKENS from '../solana/tokens.json';

export class SimulationBuilder {
  private bots;
  public cluster: string;
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
    const priceKeys: Map<string, string> = new Map();
    PYTH_PRODUCTS.mainnet.forEach(product => {
      if (product.quoteSymbol === 'USD') {
        priceKeys.set(product.baseSymbol, product.price);
      }
    });

    const config = {
      cluster: this.cluster,
      pyth: PYTH_PROGRAMS.mainnet,
      serum: SERUM_PROGRAMS[this.cluster],
      solana: SOLANA_CLUSTERS[this.cluster],
    };

    if (this.cluster === 'mainnet') {
      assert(this.bots.length == 0);
      assert(this.markets.length == 0);
      assert(this.tokens.length == 0);

      const tokens = SOLANA_TOKENS.mainnet.map(token => {
        return {
          price: priceKeys.get(token.symbol),
          ...token
        };
      });

      const markets = SERUM_MARKETS.mainnet.map(market => {
        return {
          basePrice: priceKeys.get(market.baseSymbol),
          quotePrice: priceKeys.get(market.quoteSymbol),
          ...market
        };
      });

      return [
        {
          config: config,
          tokens: tokens,
          markets: markets,
        }
      ];
    } else {
      const tokens_private = this.tokens.map(token => {
        const mintKeypair = Keypair.generate();
        const faucetKeypair = Keypair.generate();
        return {
          symbol: token.symbol,
          mint: mintKeypair.publicKey.toBase58(),
          mintPrivateKey: Buffer.from(mintKeypair.secretKey).toString('base64'),
          faucet: faucetKeypair.publicKey.toBase58(),
          faucetPrivateKey: Buffer.from(faucetKeypair.secretKey).toString('base64'),
          decimals: 6,
          price: priceKeys.get(token.symbol),
        };
      });
      tokens_private.push({
        symbol: 'SOL',
        mint: 'So11111111111111111111111111111111111111112',
        mintPrivateKey: new Uint8Array(0),
        decimals: 9,
        price: priceKeys.get('SOL'),
      });
      tokens_private.sort((a,b) => (a.symbol > b.symbol ? 1 : -1));


      const tokenKeys: Map<string, string> = new Map();
      const tokenDecimals: Map<string, number> = new Map();
      tokens_private.forEach(token => {
        tokenKeys.set(token.symbol, token.mint);
        tokenDecimals.set(token.symbol, token.decimals);
      });


      const markets_private = this.markets.map(market => {
        const marketKeypair: Keypair = Keypair.generate();
        const requestQueueKeypair: Keypair = Keypair.generate();
        const eventQueueKeypair: Keypair = Keypair.generate();
        const bidsKeypair: Keypair = Keypair.generate();
        const asksKeypair: Keypair = Keypair.generate();

        return {
          symbol: market.symbol,
          market: marketKeypair.publicKey.toBase58(),
          marketPrivateKey: Buffer.from(marketKeypair.secretKey).toString('base64'),
          baseMint: tokenKeys.get(market.base),
          baseSymbol: market.base,
          baseDecimals: tokenDecimals.get(market.base),
          basePrice: priceKeys.get(market.base),
          quoteMint: tokenKeys.get(market.quote),
          quoteSymbol: market.quote,
          quoteDecimals: tokenDecimals.get(market.quote),
          quotePrice: priceKeys.get(market.quote),
          requestQueue: requestQueueKeypair.publicKey.toBase58(),
          requestQueuePrivateKey: Buffer.from(requestQueueKeypair.secretKey).toString('base64'),
          eventQueue: eventQueueKeypair.publicKey.toBase58(),
          eventQueuePrivateKey: Buffer.from(eventQueueKeypair.secretKey).toString('base64'),
          bids: bidsKeypair.publicKey.toBase58(),
          bidsPrivateKey: Buffer.from(bidsKeypair.secretKey).toString('base64'),
          asks: asksKeypair.publicKey.toBase58(),
          asksPrivateKey: Buffer.from(asksKeypair.secretKey).toString('base64'),
        };
      });


      const bots_private = this.bots.map(bot => {

        /*
        */

        return bot;
      });


      const tokens_public = tokens_private.map(token => {
        return {
          symbol: token.symbol,
          mint: token.mint,
          decimals: token.decimals,
          price: token.price,
        };
      });

      const markets_public = markets_private.map(market => {
        return {
          symbol: market.symbol,
          market: market.market,
          baseMint: market.baseMint,
          baseSymbol: market.baseSymbol,
          baseDecimals: market.baseDecimals,
          basePrice: market.basePrice,
          quoteMint: market.quoteMint,
          quoteSymbol: market.quoteSymbol,
          quoteDecimals: market.quoteDecimals,
          quotePrice: market.quotePrice,
          requestQueue: market.requestQueue,
          eventQueue: market.eventQueue,
          bids: market.bids,
          asks: market.asks,
        };
      });

      const bots_public = bots_private.map(bot => {
        return {
        };
      });


      return [
        {
          config: config,
          tokens: tokens_public,
          markets: markets_public,
          //bots: bots_public,
        },
        {
          config: config,
          tokens: tokens_private,
          markets: markets_private,
          //bots: bots_private,
        }
      ];
    }
  }

}
