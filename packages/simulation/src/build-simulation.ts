import assert from 'assert';
import { Buffer } from 'buffer';
import { BN } from "@project-serum/anchor";
import { ORDERBOOK_LAYOUT } from "@project-serum/serum/lib/market";
import * as fs from 'fs';
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import {
  PYTH_PRODUCTS,
  //PythClient,
  PYTH_PROGRAMS,
  SERUM_PROGRAMS,
  SerumClient,
  SOLANA_CLUSTERS,
  SOLANA_TOKENS,
  SolanaClient,
} from '@yyprime/yyprime-exchange-ts';

import * as simulationMainnet from './simulation-mainnet.json';

export class SimulationBuilder {
  private bots: any[];
  public cluster: string;
  private markets: string[];
  private tokens: string[];

  constructor(cluster: string) {
    this.bots = [];
    this.cluster = cluster;
    this.markets = [];
    this.tokens = [];
    console.log(`Building simulation on ${cluster}`);
  }

  public token(symbol: string) {
    this.tokens.push(symbol);
  }

  public market(symbol: string) {
    this.markets.push(symbol);
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
          supply: token.data.data.parsed.info.supply,
          price: priceKeys.get(token.symbol),
        };
      });

      // Remove deprecated markets. Assume that the markets with the highest accrued rebates are the active ones.
      const maxReferrerRebatesAccruedByMarket = new Map();
      serumMarkets.forEach(market => {
        const symbol = `${mintSymbols.get(market.baseMint.toBase58())}/${mintSymbols.get(market.quoteMint.toBase58())}`;
        if (!maxReferrerRebatesAccruedByMarket.has(symbol) || market.referrerRebatesAccrued > maxReferrerRebatesAccruedByMarket.get(symbol).referrerRebatesAccrued) {
          maxReferrerRebatesAccruedByMarket.set(symbol, market);
        }
      });

      const markets = serumMarkets
        .filter(market => {
          const symbol = `${mintSymbols.get(market.baseMint.toBase58())}/${mintSymbols.get(market.quoteMint.toBase58())}`;
          return (
            maxReferrerRebatesAccruedByMarket.get(symbol).ownAddress === market.ownAddress &&
            mintSymbols.get(market.baseMint.toBase58()) !== 'USDC' &&
            mintSymbols.get(market.baseMint.toBase58()) !== 'USDT' &&
            mintSymbols.get(market.quoteMint.toBase58()) === 'USDC' &&
            mintSymbols.has(market.baseMint.toBase58()) &&
            mintSymbols.has(market.quoteMint.toBase58()));
        })
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

      const config_public = {
        cluster: config_private.cluster,
        pyth: config_private.pyth,
        serum: config_private.serum,
        solana: config_private.solana,
        wallet: config_private.wallet,
      };



      const tokens_private = this.tokens.map(symbol => {
        const mainnetToken = simulationMainnet.tokens.find(mainnetToken => { return mainnetToken.symbol === symbol; });
        const mintKeypair = Keypair.generate();
        const vaultKeypair = Keypair.generate();
        return {
          symbol: symbol,
          mint: mintKeypair.publicKey.toBase58(),
          mintPrivateKey: Buffer.from(mintKeypair.secretKey).toString('base64'),
          vault: vaultKeypair.publicKey.toBase58(),
          vaultPrivateKey: Buffer.from(vaultKeypair.secretKey).toString('base64'),
          decimals: mainnetToken!.decimals,
          supply: 1_000_000, //mainnetToken!.supply,
          price: priceKeys.get(symbol),
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

      const tokens_public = tokens_private.map(token => {
        return {
          symbol: token.symbol,
          mint: token.mint,
          vault: token.vault,
          decimals: token.decimals,
          supply: token.supply,
          price: token.price,
        };
      });



      const markets_private = this.markets.map(symbol => {
        const mainnetMarket = simulationMainnet.markets.find(mainnetMarket => { return mainnetMarket.symbol === symbol; });
        const marketKeypair: Keypair = Keypair.generate();
        const baseVaultKeypair: Keypair = Keypair.generate();
        const quoteVaultKeypair: Keypair = Keypair.generate();
        const requestQueueKeypair: Keypair = Keypair.generate();
        const eventQueueKeypair: Keypair = Keypair.generate();
        const bidsKeypair: Keypair = Keypair.generate();
        const asksKeypair: Keypair = Keypair.generate();

        return {
          symbol: symbol,
          market: marketKeypair.publicKey.toBase58(),
          marketPrivateKey: Buffer.from(marketKeypair.secretKey).toString('base64'),
          baseMint: tokensBySymbol.get(mainnetMarket!.baseSymbol).mint,
          baseVault: baseVaultKeypair.publicKey.toBase58(),
          baseVaultPrivateKey: Buffer.from(baseVaultKeypair.secretKey).toString('base64'),
          baseSymbol: mainnetMarket!.baseSymbol,
          basePrice: priceKeys.get(mainnetMarket!.baseSymbol),
          quoteMint: tokensBySymbol.get(mainnetMarket!.quoteSymbol).mint,
          quoteVault: quoteVaultKeypair.publicKey.toBase58(),
          quoteVaultPrivateKey: Buffer.from(quoteVaultKeypair.secretKey).toString('base64'),
          quoteSymbol: mainnetMarket!.quoteSymbol,
          quotePrice: priceKeys.get(mainnetMarket!.quoteSymbol),
          requestQueue: requestQueueKeypair.publicKey.toBase58(),
          requestQueuePrivateKey: Buffer.from(requestQueueKeypair.secretKey).toString('base64'),
          eventQueue: eventQueueKeypair.publicKey.toBase58(),
          eventQueuePrivateKey: Buffer.from(eventQueueKeypair.secretKey).toString('base64'),
          bids: bidsKeypair.publicKey.toBase58(),
          bidsPrivateKey: Buffer.from(bidsKeypair.secretKey).toString('base64'),
          asks: asksKeypair.publicKey.toBase58(),
          asksPrivateKey: Buffer.from(asksKeypair.secretKey).toString('base64'),
          //vaultSignerNonce: mainnetMarket!.vaultSignerNonce,
          quoteDustThreshold: mainnetMarket!.quoteDustThreshold,
          baseLotSize: mainnetMarket!.baseLotSize,
          quoteLotSize: mainnetMarket!.quoteLotSize,
          feeRateBps: mainnetMarket!.feeRateBps,
        };
      });

      const marketsBySymbol: Map<string, any> = new Map();
      markets_private.forEach(market => {
        marketsBySymbol.set(market.symbol, market);
      });

      const markets_public = markets_private.map(market => {
        return {
          symbol: market.symbol,
          market: market.market,
          baseMint: market.baseMint,
          baseSymbol: market.baseSymbol,
          basePrice: market.basePrice,
          quoteMint: market.quoteMint,
          quoteSymbol: market.quoteSymbol,
          quotePrice: market.quotePrice,
          requestQueue: market.requestQueue,
          eventQueue: market.eventQueue,
          bids: market.bids,
          asks: market.asks,
        };
      });



      const connection: Connection = new Connection(SERUM_PROGRAMS['mainnet'].url);

      const bookOrders = await Promise.all(markets_private.map(async (market) => {
        let asks: [number, number, BN, BN][] = [];
        let bids: [number, number, BN, BN][] = [];

        const mainnetMarket = simulationMainnet.markets.find(mainnetMarket => { return mainnetMarket.symbol === market.symbol; });
        const mainnetBaseToken = simulationMainnet.tokens.find(mainnetToken => { return mainnetToken.symbol === market.baseSymbol; });
        const mainnetQuoteToken = simulationMainnet.tokens.find(mainnetToken => { return mainnetToken.symbol === market.quoteSymbol; });

        if (mainnetMarket && mainnetBaseToken && mainnetQuoteToken) {
          asks = getPriceLevels(mainnetMarket, mainnetBaseToken, mainnetQuoteToken, (await connection.getAccountInfo(new PublicKey(mainnetMarket.asks)))!.data);
          bids = getPriceLevels(mainnetMarket, mainnetBaseToken, mainnetQuoteToken, (await connection.getAccountInfo(new PublicKey(mainnetMarket.bids)))!.data);
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
          walletBalance: 100,
          openOrders: openOrdersKeypair.publicKey.toBase58(),
          openOrdersPrivateKey: Buffer.from(openOrdersKeypair.secretKey).toString('base64'),
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

}

function getPriceLevels(market, baseToken, quoteToken, data): [number, number, BN, BN][] {
  const { accountFlags, slab } = ORDERBOOK_LAYOUT.decode(data);
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
  return levels.map(([priceLots, sizeLots]) => [
    priceLotsToNumber(priceLots, new BN(market.baseLotSize), baseToken.decimals, new BN(market.quoteLotSize), quoteToken.decimals),
    baseSizeLotsToNumber(sizeLots, new BN(market.baseLotSize), baseToken.decimals),
    priceLots,
    sizeLots,
  ]);
}

function priceLotsToNumber(price: BN, baseLotSize: BN, baseSplTokenDecimals: number, quoteLotSize: BN, quoteSplTokenDecimals: number) {
  return divideBnToNumber(price.mul(quoteLotSize).mul(baseSplTokenMultiplier(baseSplTokenDecimals)), baseLotSize.mul(quoteSplTokenMultiplier(quoteSplTokenDecimals)));
}

function baseSizeLotsToNumber(size: BN, baseLotSize: BN, baseSplTokenDecimals: number) {
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




(async () => {
  //const simulationBuilder: SimulationBuilder = new SimulationBuilder('mainnet');
  const simulationBuilder: SimulationBuilder = new SimulationBuilder('localnet');

  if (simulationBuilder.cluster === 'mainnet') {
    const [simulation_public] = await simulationBuilder.build();
    fs.writeFileSync('../monitor/src/config/simulation-mainnet.json', JSON.stringify(simulation_public, null, 2));
    fs.writeFileSync('src/simulation-mainnet.json', JSON.stringify(simulation_public, null, 2));
  } else {
    simulationBuilder.token("BTC");
    simulationBuilder.token("ETH");
    simulationBuilder.token("SOL");
    simulationBuilder.token("USDC");

    simulationBuilder.market("BTC/USDC");
    simulationBuilder.market("ETH/USDC");
    simulationBuilder.market("SOL/USDC");

    simulationBuilder.bot("BTC_mm_0", "maker", "BTC", 10_000, "USDC", 10_000, { half_spread: 0.005 });
    simulationBuilder.bot("ETH_mm_0", "maker", "ETH", 10_000, "USDC", 10_000, { half_spread: 0.005 });
    //simulationBuilder.bot("SOL_mm_0", "maker", "SOL", 10_000, "USDC", 10_000, { half_spread: 0.005 });

    const [simulation_public, simulation_private, simulation_orders] = await simulationBuilder.build();
    fs.writeFileSync('../monitor/src/config/simulation.json', JSON.stringify(simulation_public, null, 2));
    fs.writeFileSync('src/simulation.json', JSON.stringify(simulation_private, null, 2));
    fs.writeFileSync('src/simulation-orders.json', JSON.stringify(simulation_orders, null, 2));
  }
})();
