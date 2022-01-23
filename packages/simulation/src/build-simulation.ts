import assert from 'assert';
import { Buffer } from 'buffer';
import { BN } from "@project-serum/anchor";
import { ORDERBOOK_LAYOUT } from "@project-serum/serum/lib/market";
import * as fs from 'fs';
import { Connection, Keypair, PublicKey } from "@solana/web3.js";

import { PythClient } from '@yyprime/yyprime-exchange-ts/src/pyth';
import { SerumClient } from '@yyprime/yyprime-exchange-ts/src/serum';
import { SolanaClient } from '@yyprime/yyprime-exchange-ts/src/solana';

import PYTH_PRODUCTS from '@yyprime/yyprime-exchange-ts/src/pyth/products.json';
import PYTH_PROGRAMS from '@yyprime/yyprime-exchange-ts/src/pyth/programs.json';
import SERUM_PROGRAMS from '@yyprime/yyprime-exchange-ts/src/serum/programs.json';
import SOLANA_CLUSTERS from '@yyprime/yyprime-exchange-ts/src/solana/clusters.json';
import SOLANA_TOKENS from '@yyprime/yyprime-exchange-ts/src/solana/tokens.json';

import * as simulationMainnet from './simulation-mainnet_MANUAL.json';

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

  public market(params) {
    this.markets.push({ symbol: `${params.baseSymbol}/${params.quoteSymbol}`, ...params });
  }

  public bot(name: string, type: string, base: string, baseBalance: number, quote: string, quoteBalance: number, params) {
    this.bots.push({ name: name, type: type, symbol: `${base}/${quote}`, base, baseBalance, quote, quoteBalance, params });
  }

  public async build() {
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

      const connection: Connection = new Connection(config.serum.url);

      //const pythProducts = await PythClient.query(connection, new PublicKey(config.pyth.program));
      const serumMarkets = await SerumClient.query(connection, new PublicKey(config.serum.program));
      const solanaTokens = await SolanaClient.query(connection, SOLANA_TOKENS.mainnet.map(token => { return { symbol: token.symbol, mint: new PublicKey(token.mint) } }));

      const mintSymbols: Map<string, string> = new Map();

      const tokens = solanaTokens.map(token => {
        mintSymbols.set(token.mint.toBase58(), token.symbol);

        return {
          symbol: token.symbol,
          mint: token.mint.toBase58(),
          decimals: token.data.data.parsed.info.decimals,
          mintSupply: token.data.data.parsed.info.supply,
          price: priceKeys.get(token.symbol),
        };
      });

      const markets = serumMarkets
        .filter(market => { return mintSymbols.get(market.quoteMint.toBase58()) === 'USDC' && mintSymbols.has(market.baseMint.toBase58()) && mintSymbols.has(market.quoteMint.toBase58()); })
        .map(market => {
          return {
            symbol: `${mintSymbols.get(market.baseMint.toBase58())}/${mintSymbols.get(market.quoteMint.toBase58())}`,
            market: market.ownAddress.toBase58(),
            baseMint: market.baseMint.toBase58(),
            baseVault: market.baseVault.toBase58(),
            baseSymbol: `${mintSymbols.get(market.baseMint.toBase58())}`,
            basePrice: priceKeys.get(`${mintSymbols.get(market.baseMint.toBase58())}`),
            quoteMint: market.quoteMint.toBase58(),
            quoteVault: market.quoteVault.toBase58(),
            quoteSymbol: `${mintSymbols.get(market.quoteMint.toBase58())}`,
            quotePrice: priceKeys.get(`${mintSymbols.get(market.quoteMint.toBase58())}`),
            requestQueue: market.requestQueue.toBase58(),
            eventQueue: market.eventQueue.toBase58(),
            bids: market.bids.toBase58(),
            asks: market.asks.toBase58(),
            vaultSignerNonce: new BN(market.vaultSignerNonce).toNumber(),
            quoteDustThreshold: new BN(market.quoteDustThreshold).toNumber(),
            baseLotSize: new BN(market.baseLotSize).toNumber(),
            quoteLotSize: new BN(market.quoteLotSize).toNumber(),
            feeRateBps: new BN(market.feeRateBps).toNumber(),
            referrerRebatesAccrued: new BN(market.referrerRebatesAccrued).toNumber()
          };
        })
        .sort((a, b) => { return a.symbol > b.symbol ? 1 : -1; });

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
        walletBalance: 100,
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
        const marketKeypair: Keypair = Keypair.generate();
        const baseVaultKeypair: Keypair = Keypair.generate();
        const quoteVaultKeypair: Keypair = Keypair.generate();
        const requestQueueKeypair: Keypair = Keypair.generate();
        const eventQueueKeypair: Keypair = Keypair.generate();
        const bidsKeypair: Keypair = Keypair.generate();
        const asksKeypair: Keypair = Keypair.generate();

        return {
          symbol: market.symbol,
          market: marketKeypair.publicKey.toBase58(),
          marketPrivateKey: Buffer.from(marketKeypair.secretKey).toString('base64'),
          baseMint: tokensBySymbol.get(market.baseSymbol).mint,
          baseVault: baseVaultKeypair.publicKey.toBase58(),
          baseVaultPrivateKey: Buffer.from(baseVaultKeypair.secretKey).toString('base64'),
          baseSymbol: market.baseSymbol,
          basePrice: priceKeys.get(market.baseSymbol),
          quoteMint: tokensBySymbol.get(market.quoteSymbol).mint,
          quoteVault: quoteVaultKeypair.publicKey.toBase58(),
          quoteVaultPrivateKey: Buffer.from(quoteVaultKeypair.secretKey).toString('base64'),
          quoteSymbol: market.quoteSymbol,
          quotePrice: priceKeys.get(market.quoteSymbol),
          requestQueue: requestQueueKeypair.publicKey.toBase58(),
          requestQueuePrivateKey: Buffer.from(requestQueueKeypair.secretKey).toString('base64'),
          eventQueue: eventQueueKeypair.publicKey.toBase58(),
          eventQueuePrivateKey: Buffer.from(eventQueueKeypair.secretKey).toString('base64'),
          bids: bidsKeypair.publicKey.toBase58(),
          bidsPrivateKey: Buffer.from(bidsKeypair.secretKey).toString('base64'),
          asks: asksKeypair.publicKey.toBase58(),
          asksPrivateKey: Buffer.from(asksKeypair.secretKey).toString('base64'),
          //TODO vaultSignerNonce: market.vaultSignerNonce,
          quoteDustThreshold: market.quoteDustThreshold,
          baseLotSize: market.baseLotSize,
          quoteLotSize: market.quoteLotSize,
          feeRateBps: market.feeRateBps,
        };
      });

      const marketsBySymbol: Map<string, any> = new Map();
      markets_private.forEach(market => {
        marketsBySymbol.set(market.symbol, market);
      });

      const connection: Connection = new Connection(SERUM_PROGRAMS['mainnet'].url);

      const bookOrders = await Promise.all(markets_private.map(async (market) => {
        let asks: { priceLots: number; sizeLots: number; }[] = [];
        let bids: { priceLots: number; sizeLots: number; }[] = [];

        const mainnetMarket = simulationMainnet.markets.find(mainnetMarket => { return mainnetMarket.symbol === market.symbol; });

        if (mainnetMarket) {
          asks = this.getPriceLevels((await connection.getAccountInfo(new PublicKey(mainnetMarket.asks)))!.data);
          bids = this.getPriceLevels((await connection.getAccountInfo(new PublicKey(mainnetMarket.bids)))!.data);
        }

        return {
          symbol: market.symbol,
          asks: asks,
          bids: bids,
        };
      }));

      const bots_private = this.bots.map(bot => {
        const walletKeypair: Keypair = Keypair.generate();
        const openOrdersKeypair: Keypair = Keypair.generate();

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
          openOrders: openOrdersKeypair.publicKey.toBase58(),
          openOrdersPrivateKey: Buffer.from(openOrdersKeypair.secretKey).toString('base64'),
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
        },
        bookOrders,
      ];
    }
  }

  private getPriceFromKey(key) {
    return key.ushrn(64);
  }

  private getPriceLevels(data) {
    const { accountFlags, slab } = ORDERBOOK_LAYOUT.decode(data);
    const descending = accountFlags.bids;
    const levels: [BN, BN][] = []; // (price, size)
    for (const { key, quantity } of slab.items(descending)) {
      const price = this.getPriceFromKey(key);
      if (levels.length > 0 && levels[levels.length - 1][0].eq(price)) {
        levels[levels.length - 1][1].iadd(quantity);
      } else {
        levels.push([price, quantity]);
      }
    }
    return levels.map(([priceLots, sizeLots]) => { return {
      //this.market.priceLotsToNumber(priceLots),
      //this.market.baseSizeLotsToNumber(sizeLots),
      priceLots: priceLots.toNumber(),
      sizeLots: sizeLots.toNumber(),
    }});
  }

}



(async () => {
  //const simulationBuilder: SimulationBuilder = new SimulationBuilder('mainnet');
  const simulationBuilder: SimulationBuilder = new SimulationBuilder('localnet');

  if (simulationBuilder.cluster === 'mainnet') {
    const [simulation_public] = await simulationBuilder.build();
    fs.writeFileSync('../monitor/src/config/simulation-mainnet.json', JSON.stringify(simulation_public, null, 2));
    fs.writeFileSync('src/simulation/simulation-mainnet.json', JSON.stringify(simulation_public, null, 2));
  } else {
    simulationBuilder.token("BTC", 1_000_000_000, 6);
    //simulationBuilder.token("ETH", 1_000_000_000, 6);
    //simulationBuilder.token("SOL", 1_000_000_000, 9);
    simulationBuilder.token("USDC", 1_000_000_000, 6);

    simulationBuilder.market({
      baseSymbol: "BTC",
      quoteSymbol: "USDC",
      //TODO vaultSignerNonce: 0,
      quoteDustThreshold: 100,
      baseLotSize: 100,
      quoteLotSize: 10,
      feeRateBps: 0,
    });
    /*
    simulationBuilder.market({
      baseSymbol: "ETH",
      quoteSymbol: "USDC",
      //TODO vaultSignerNonce: 0,
      quoteDustThreshold: 100,
      baseLotSize: 1000,
      quoteLotSize: 10,
      feeRateBps: 0,
    });
    simulationBuilder.market({
      baseSymbol: "SOL",
      quoteSymbol: "USDC",
      //TODO vaultSignerNonce: 0,
      quoteDustThreshold: 100,
      baseLotSize: 100000000,
      quoteLotSize: 100,
      feeRateBps: 0,
    });
    */

    simulationBuilder.bot("BTC_mm_0", "maker", "BTC", 10_000, "USDC", 10_000, { half_spread: 0.005 });
    //simulationBuilder.bot("ETH", "maker", 250, "USDC", 100_000, {});
    //simulationBuilder.bot("SOL", "maker", 500, "USDC", 100_000, {});

    const [simulation_public, simulation_private, simulation_orders] = await simulationBuilder.build();
    fs.writeFileSync('../monitor/src/config/simulation.json', JSON.stringify(simulation_public, null, 2));
    fs.writeFileSync('src/simulation/simulation.json', JSON.stringify(simulation_private, null, 2));
    fs.writeFileSync('src/simulation/simulation-orders.json', JSON.stringify(simulation_orders, null, 2));
  }
})();
