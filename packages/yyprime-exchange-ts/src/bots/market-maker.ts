import { Bot } from './bot';

export class MarketMaker extends Bot {

  //const sizePerc = parseFloat(process.env.SIZE_PERC || '0.1');
  //const charge = parseFloat(process.env.CHARGE || '0.0010');
  //const leanCoeff = parseFloat(process.env.LEAN_COEFF || '0.0005');
  //const bias = parseFloat(process.env.BIAS || '0.0');
  //const requoteThresh = parseFloat(process.env.REQUOTE_THRESH || '0.0');
  //const takeSpammers = process.env.TAKE_SPAMMERS === 'true';
  //const spammerCharge = parseFloat(process.env.SPAMMER_CHARGE || '2'); // multiplier on charge

  constructor(name: string, market: string) {
    super(name, market);
  }

  process() {
    console.log("MARKET MAKER PROCESSING: " + this.name);

    /*
      // get fresh data
      // get orderbooks, get perp markets, caches
      // TODO load pyth oracle itself for most accurate prices
      const [bids, asks, mangoCache, mangoAccount]: [
        BookSide,
        BookSide,
        MangoCache,
        MangoAccount,
      ] = await Promise.all([
        perpMarket.loadBids(connection),
        perpMarket.loadAsks(connection),
        mangoGroup.loadCache(connection),
        client.getMangoAccount(mangoAccountPk, mangoGroup.dexProgramId),
      ]);

      // TODO store the prices in an array to calculate volatility

      // Model logic
      const fairValue = mangoGroup.getPrice(marketIndex, mangoCache).toNumber();
      const equity = mangoAccount
        .computeValue(mangoGroup, mangoCache)
        .toNumber();
      const perpAccount = mangoAccount.perpAccounts[marketIndex];
      // TODO look at event queue as well for unprocessed fills
      const basePos = perpAccount.getBasePositionUi(perpMarket);

      // TODO volatility adjustment
      const size = (equity * sizePerc) / fairValue;
      const lean = (-leanCoeff * basePos) / size;
      const bidPrice = fairValue * (1 - charge + lean + bias);
      const askPrice = fairValue * (1 + charge + lean + bias);

      const [modelBidPrice, nativeBidSize] = perpMarket.uiToNativePriceQuantity(
        bidPrice,
        size,
      );
      const [modelAskPrice, nativeAskSize] = perpMarket.uiToNativePriceQuantity(
        askPrice,
        size,
      );

      const bestBid = bids.getBest();
      const bestAsk = asks.getBest();

      const bookAdjBid =
        bestAsk !== undefined
          ? BN.min(bestAsk.priceLots.sub(ONE_BN), modelBidPrice)
          : modelBidPrice;
      const bookAdjAsk =
        bestBid !== undefined
          ? BN.max(bestBid.priceLots.add(ONE_BN), modelAskPrice)
          : modelAskPrice;

      // TODO use order book to requote if size has changed
      const openOrders = mangoAccount
        .getPerpOpenOrders()
        .filter((o) => o.marketIndex === marketIndex);
      let moveOrders = openOrders.length === 0 || openOrders.length > 2;
      for (const o of openOrders) {
        console.log(
          `${o.side} ${o.price.toString()} -> ${
            o.side === 'buy' ? bookAdjBid.toString() : bookAdjAsk.toString()
          }`,
        );

        if (o.side === 'buy') {
          if (
            Math.abs(o.price.toNumber() / bookAdjBid.toNumber() - 1) >
            requoteThresh
          ) {
            moveOrders = true;
          }
        } else {
          if (
            Math.abs(o.price.toNumber() / bookAdjAsk.toNumber() - 1) >
            requoteThresh
          ) {
            moveOrders = true;
          }
        }
      }

      // Start building the transaction
      const tx = new Transaction();

      //Clear 1 lot size orders at the top of book that bad people use to manipulate the price
      if (
        takeSpammers &&
        bestBid !== undefined &&
        bestBid.sizeLots.eq(ONE_BN) &&
        bestBid.priceLots.toNumber() / modelAskPrice.toNumber() - 1 >
          spammerCharge * charge + 0.0005
      ) {
        console.log(`${marketName}-PERP taking best bid spammer`);
        const takerSell = makePlacePerpOrderInstruction(
          mangoProgramId,
          mangoGroup.publicKey,
          mangoAccount.publicKey,
          payer.publicKey,
          mangoCache.publicKey,
          perpMarket.publicKey,
          perpMarket.bids,
          perpMarket.asks,
          perpMarket.eventQueue,
          mangoAccount.getOpenOrdersKeysInBasket(),
          bestBid.priceLots,
          ONE_BN,
          new BN(Date.now()),
          'sell',
          'ioc',
        );
        tx.add(takerSell);
      } else if (
        takeSpammers &&
        bestAsk !== undefined &&
        bestAsk.sizeLots.eq(ONE_BN) &&
        modelBidPrice.toNumber() / bestAsk.priceLots.toNumber() - 1 >
          spammerCharge * charge + 0.0005
      ) {
        console.log(`${marketName}-PERP taking best ask spammer`);
        const takerBuy = makePlacePerpOrderInstruction(
          mangoProgramId,
          mangoGroup.publicKey,
          mangoAccount.publicKey,
          payer.publicKey,
          mangoCache.publicKey,
          perpMarket.publicKey,
          perpMarket.bids,
          perpMarket.asks,
          perpMarket.eventQueue,
          mangoAccount.getOpenOrdersKeysInBasket(),
          bestAsk.priceLots,
          ONE_BN,
          new BN(Date.now()),
          'buy',
          'ioc',
        );
        tx.add(takerBuy);
      }
      if (moveOrders) {
        // cancel all, requote
        const cancelAllInstr = makeCancelAllPerpOrdersInstruction(
          mangoProgramId,
          mangoGroup.publicKey,
          mangoAccount.publicKey,
          payer.publicKey,
          perpMarket.publicKey,
          perpMarket.bids,
          perpMarket.asks,
          new BN(20),
        );

        const placeBidInstr = makePlacePerpOrderInstruction(
          mangoProgramId,
          mangoGroup.publicKey,
          mangoAccount.publicKey,
          payer.publicKey,
          mangoCache.publicKey,
          perpMarket.publicKey,
          perpMarket.bids,
          perpMarket.asks,
          perpMarket.eventQueue,
          mangoAccount.getOpenOrdersKeysInBasket(),
          bookAdjBid,
          nativeBidSize,
          new BN(Date.now()),
          'buy',
          'postOnlySlide',
        );

        const placeAskInstr = makePlacePerpOrderInstruction(
          mangoProgramId,
          mangoGroup.publicKey,
          mangoAccount.publicKey,
          payer.publicKey,
          mangoCache.publicKey,
          perpMarket.publicKey,
          perpMarket.bids,
          perpMarket.asks,
          perpMarket.eventQueue,
          mangoAccount.getOpenOrdersKeysInBasket(),
          bookAdjAsk,
          nativeAskSize,
          new BN(Date.now()),
          'sell',
          'postOnlySlide',
        );
        tx.add(cancelAllInstr);
        tx.add(placeBidInstr);
        tx.add(placeAskInstr);
      } else {
        console.log(`${marketName}-PERP Not requoting. No need to move orders`);
      }
      if (tx.instructions.length > 0) {
        const txid = await client.sendTransaction(tx, payer, []);
        console.log(
          `${marketName}-PERP adjustment success: ${txid.toString()}`,
        );
      }
    */
  }

}
