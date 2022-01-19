import assert from 'assert';
import { Buffer } from 'buffer';
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

  public token(token: string, supply: number, decimals: number ) {
    this.tokens.push({ symbol: token, supply: supply, decimals: decimals });
  }

  public market(base: string, quote: string) {
    this.markets.push({ symbol: `${base}/${quote}`, base: base, quote: quote });
  }

  public bot(name: string, type: string, base: string, baseBalance: number, quote: string, quoteBalance: number, params) {
    this.bots.push({ name: name, type: type, symbol: `${base}/${quote}`, base, baseBalance, quote, quoteBalance, params });
  }

  public build() {
    const priceKeys: Map<string, string> = new Map();
    PYTH_PRODUCTS.mainnet.forEach(product => {
      if (product.quoteSymbol === 'USD') {
        priceKeys.set(product.baseSymbol, product.price);
      }
    });

    if (this.cluster === 'mainnet') {
      assert(this.bots.length == 0);
      assert(this.markets.length == 0);
      assert(this.tokens.length == 0);

      const config = {
        cluster: this.cluster,
        pyth: PYTH_PROGRAMS.mainnet,
        serum: SERUM_PROGRAMS[this.cluster],
        solana: SOLANA_CLUSTERS[this.cluster],
      };

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
      const simulationWalletKeypair: Keypair = Keypair.generate();

      const config_private = {
        cluster: this.cluster,
        pyth: PYTH_PROGRAMS.mainnet,
        serum: SERUM_PROGRAMS[this.cluster],
        solana: SOLANA_CLUSTERS[this.cluster],
        wallet: simulationWalletKeypair.publicKey.toBase58(),
        walletPrivateKey: Buffer.from(simulationWalletKeypair.secretKey).toString('base64'),
      };

      const tokens_private = this.tokens.map(token => {
        const mintKeypair = Keypair.generate();
        const vaultKeypair = Keypair.generate();
        return {
          symbol: token.symbol,
          mint: mintKeypair.publicKey.toBase58(),
          mintPrivateKey: Buffer.from(mintKeypair.secretKey).toString('base64'),
          vault: vaultKeypair.publicKey.toBase58(),
          vaultPrivateKey: Buffer.from(vaultKeypair.secretKey).toString('base64'),
          decimals: token.decimals,
          mintSupply: token.supply,
          price: priceKeys.get(token.symbol),
        };
      });
      //tokens_private.push({
        //symbol: 'SOL',
        //mint: 'So11111111111111111111111111111111111111112',
        //mintPrivateKey: new Uint8Array(0),
        //decimals: 9,
        //price: priceKeys.get('SOL'),
      //});
      //tokens_private.sort((a,b) => (a.symbol > b.symbol ? 1 : -1));

      const tokensBySymbol: Map<string, any> = new Map();
      tokens_private.forEach(token => {
        tokensBySymbol.set(token.symbol, token);
      });

      const markets_private = this.markets.map(market => {
        const baseVaultKeypair: Keypair = Keypair.generate();
        const quoteVaultKeypair: Keypair = Keypair.generate();
        const marketKeypair: Keypair = Keypair.generate();
        const requestQueueKeypair: Keypair = Keypair.generate();
        const eventQueueKeypair: Keypair = Keypair.generate();
        const bidsKeypair: Keypair = Keypair.generate();
        const asksKeypair: Keypair = Keypair.generate();

        //TODO TickSize

        //TODO LotSize

        return {
          symbol: market.symbol,
          baseVault: baseVaultKeypair.publicKey.toBase58(),
          baseVaultPrivateKey: Buffer.from(baseVaultKeypair.secretKey).toString('base64'),
          quoteVault: quoteVaultKeypair.publicKey.toBase58(),
          quoteVaultPrivateKey: Buffer.from(quoteVaultKeypair.secretKey).toString('base64'),
          market: marketKeypair.publicKey.toBase58(),
          marketPrivateKey: Buffer.from(marketKeypair.secretKey).toString('base64'),
          baseLotSize: 1, //TODO
          baseMint: tokensBySymbol.get(market.base).mint,
          baseSymbol: market.base,
          baseDecimals: tokensBySymbol.get(market.base).decimals,
          basePrice: priceKeys.get(market.base),
          quoteLotSize: 1, //TODO
          quoteMint: tokensBySymbol.get(market.quote).mint,
          quoteSymbol: market.quote,
          quoteDecimals: tokensBySymbol.get(market.quote).decimals,
          quotePrice: priceKeys.get(market.quote),
          feeRateBps: 0,
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

      const marketsBySymbol: Map<string, any> = new Map();
      markets_private.forEach(market => {
        marketsBySymbol.set(market.symbol, market);
      });

      const bots_private = this.bots.map(bot => {
        const walletKeypair: Keypair = Keypair.generate();

        //TODO TickSize

        //TODO LotSize

        return {
          name: bot.name,
          type: bot.type,
          symbol: bot.symbol,
          market: marketsBySymbol.get(bot.symbol).market,
          base: bot.base,
          baseBalance: bot.baseBalance,
          baseDecimals: tokensBySymbol.get(bot.base).decimals,
          baseMint: tokensBySymbol.get(bot.base).mint,
          baseMintPrivateKey: tokensBySymbol.get(bot.base).mintPrivateKey,
          baseVault: tokensBySymbol.get(bot.base).vault,
          baseVaultPrivateKey: tokensBySymbol.get(bot.base).vaultPrivateKey,
          quote: bot.quote,
          quoteBalance: bot.quoteBalance,
          quoteDecimals: tokensBySymbol.get(bot.quote).decimals,
          quoteMint: tokensBySymbol.get(bot.quote).mint,
          quoteMintPrivateKey: tokensBySymbol.get(bot.quote).mintPrivateKey,
          quoteVault: tokensBySymbol.get(bot.quote).vault,
          quoteVaultPrivateKey: tokensBySymbol.get(bot.quote).vaultPrivateKey,
          params: bot.params,
          wallet: walletKeypair.publicKey.toBase58(),
          walletPrivateKey: Buffer.from(walletKeypair.secretKey).toString('base64'),
        };
      });


      const config_public = {
        cluster: config_private.cluster,
        pyth: config_private.pyth,
        serum: config_private.serum,
        solana: config_private.solana,
        wallet: config_private.wallet,
      };

      const tokens_public = tokens_private.map(token => {
        return {
          symbol: token.symbol,
          mint: token.mint,
          vault: token.vault,
          decimals: token.decimals,
          mintSupply: token.mintSupply,
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
          name: bot.name,
          type: bot.type,
          symbol: bot.symbol,
          market: bot.market,
          base: bot.base,
          baseBalance: bot.baseBalance,
          baseDecimals: bot.baseDecimals,
          baseMint: bot.baseMint,
          quote: bot.quote,
          quoteBalance: bot.quoteBalance,
          quoteDecimals: bot.quoteDecimals,
          quoteMint: bot.quoteMint,
          params: bot.params,
          wallet: bot.wallet,
        };
      });


      return [
        {
          config: config_public,
          tokens: tokens_public,
          markets: markets_public,
          bots: bots_public,
        },
        {
          config: config_private,
          tokens: tokens_private,
          markets: markets_private,
          bots: bots_private,
        }
      ];
    }
  }

}
