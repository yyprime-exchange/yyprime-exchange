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


      // get fresh data
      // get orderbooks, get perp markets, caches
      // TODO load pyth oracle itself for most accurate prices
      const [bids, asks, YYPXCache, YYPXAccount]: [
        BookSide,
        BookSide,
        YYPXCache,
        YYPXAccount,
      ] = await Promise.all([
        perpMarket.loadBids(connection),
        perpMarket.loadAsks(connection),
        YYPXGroup.loadCache(connection),
        client.getYYPXAccount(YYPXAccountPk, YYPXGroup.dexProgramId),
      ]);

      // TODO store the prices in an array to calculate volatility

      // Model logic
      const fairValue = YYPXGroup.getPrice(marketIndex, YYPXCache).toNumber();
      const equity = YYPXAccount
        .computeValue(YYPXGroup, YYPXCache)
        .toNumber();
      const perpAccount = YYPXAccount.perpAccounts[marketIndex];
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
      const openOrders = YYPXAccount
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
          YYPXProgramId,
          YYPXGroup.publicKey,
          YYPXAccount.publicKey,
          payer.publicKey,
          YYPXCache.publicKey,
          perpMarket.publicKey,
          perpMarket.bids,
          perpMarket.asks,
          perpMarket.eventQueue,
          YYPXAccount.getOpenOrdersKeysInBasket(),
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
          YYPXProgramId,
          YYPXGroup.publicKey,
          YYPXAccount.publicKey,
          payer.publicKey,
          YYPXCache.publicKey,
          perpMarket.publicKey,
          perpMarket.bids,
          perpMarket.asks,
          perpMarket.eventQueue,
          YYPXAccount.getOpenOrdersKeysInBasket(),
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
          YYPXProgramId,
          YYPXGroup.publicKey,
          YYPXAccount.publicKey,
          payer.publicKey,
          perpMarket.publicKey,
          perpMarket.bids,
          perpMarket.asks,
          new BN(20),
        );

        const placeBidInstr = makePlacePerpOrderInstruction(
          YYPXProgramId,
          YYPXGroup.publicKey,
          YYPXAccount.publicKey,
          payer.publicKey,
          YYPXCache.publicKey,
          perpMarket.publicKey,
          perpMarket.bids,
          perpMarket.asks,
          perpMarket.eventQueue,
          YYPXAccount.getOpenOrdersKeysInBasket(),
          bookAdjBid,
          nativeBidSize,
          new BN(Date.now()),
          'buy',
          'postOnlySlide',
        );

        const placeAskInstr = makePlacePerpOrderInstruction(
          YYPXProgramId,
          YYPXGroup.publicKey,
          YYPXAccount.publicKey,
          payer.publicKey,
          YYPXCache.publicKey,
          perpMarket.publicKey,
          perpMarket.bids,
          perpMarket.asks,
          perpMarket.eventQueue,
          YYPXAccount.getOpenOrdersKeysInBasket(),
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

  }




  /*
try:
    # Update current state
    price = self.oracle.fetch_price(self.context)
    self.logger.info(f"Price is: {price}")
    inventory = self.fetch_inventory()

    # Calculate what we want the orders to be.
    bid, ask = self.calculate_order_prices(price)
    buy_quantity, sell_quantity = self.calculate_order_quantities(price, inventory)

    current_orders = self.market_operations.load_my_orders()
    buy_orders = [order for order in current_orders if order.side == YYPX.Side.BUY]
    if self.orders_require_action(buy_orders, bid, buy_quantity):
        self.logger.info("Cancelling BUY orders.")
        for order in buy_orders:
            self.market_operations.cancel_order(order)
        buy_order: YYPX.Order = YYPX.Order.from_basic_info(
            YYPX.Side.BUY, bid, buy_quantity, YYPX.OrderType.POST_ONLY)
        self.market_operations.place_order(buy_order)

    sell_orders = [order for order in current_orders if order.side == YYPX.Side.SELL]
    if self.orders_require_action(sell_orders, ask, sell_quantity):
        self.logger.info("Cancelling SELL orders.")
        for order in sell_orders:
            self.market_operations.cancel_order(order)
        sell_order: YYPX.Order = YYPX.Order.from_basic_info(
            YYPX.Side.SELL, ask, sell_quantity, YYPX.OrderType.POST_ONLY)
        self.market_operations.place_order(sell_order)

    self.update_health_on_successful_iteration()
except Exception as exception:
    self.logger.warning(
        f"Pausing and continuing after problem running market-making iteration: {exception} - {traceback.format_exc()}")

# Wait and hope for fills.
self.logger.info(f"Pausing for {self.pause} seconds.")
time.sleep(self.pause.seconds)
  */




  /*
def pulse(self, context: YYPX.Context, model_state: ModelState):
    try:
        payer = YYPX.CombinableInstructions.from_wallet(self.wallet)

        desired_orders = self.desired_orders_builder.build(context, model_state)
        existing_orders = self.order_tracker.existing_orders(model_state)
        reconciled = self.order_reconciler.reconcile(model_state, existing_orders, desired_orders)

        cancellations = YYPX.CombinableInstructions.empty()
        for to_cancel in reconciled.to_cancel:
            self.logger.info(f"Cancelling {self.market.symbol} {to_cancel}")
            cancel = self.market_instruction_builder.build_cancel_order_instructions(to_cancel)
            cancellations += cancel

        place_orders = YYPX.CombinableInstructions.empty()
        for to_place in reconciled.to_place:
            desired_client_id: int = context.random_client_id()
            to_place_with_client_id = to_place.with_client_id(desired_client_id)
            self.order_tracker.track(to_place_with_client_id)

            self.logger.info(f"Placing {self.market.symbol} {to_place_with_client_id}")
            place_order = self.market_instruction_builder.build_place_order_instructions(to_place_with_client_id)
            place_orders += place_order

        crank = self.market_instruction_builder.build_crank_instructions([])
        settle = self.market_instruction_builder.build_settle_instructions()
        (payer + cancellations + place_orders + crank + settle).execute(context, on_exception_continue=True)

        self.pulse_complete.on_next(datetime.now())
    except Exception as exception:
        self.logger.error(f"[{context.name}] Market-maker error on pulse: {exception} - {traceback.format_exc()}")
        self.pulse_error.on_next(exception)
  */





  /*
{
  "group": "mainnet.1",
  "YYPXAccountName": "Market Makooor",
  "YYPXAccountPubkey": "optional pubkey string if your YYPX account doesn't have name",
  "interval": 5000,
  "batch": 2,
  "assets": {
    "MNGO": {
      "perp": {
        "charge": 0.0020,
        "sizePerc": 0.01,
        "leanCoeff": 0.0010,
        "bias": 0.0,
        "requoteThresh": 0.0002,
        "takeSpammers": true,
        "spammerCharge": 2
      }
    },

    "BTC": {
      "perp": {
        "charge": 0.0010,
        "sizePerc": 0.05,
        "leanCoeff": 0.00025,
        "bias": 0.0,
        "requoteThresh": 0.0002,
        "takeSpammers": true,
        "spammerCharge": 2
      }
    },
    "ETH": {
      "perp": {
        "charge": 0.00075,
        "sizePerc": 0.05,
        "leanCoeff": 0.000375,
        "bias": 0.0,
        "requoteThresh": 0.0002,
        "takeSpammers": true,
        "spammerCharge": 2
      }
    },

    "SOL": {
      "perp": {
        "charge": 0.0010,
        "sizePerc": 0.05,
        "leanCoeff": 0.0005,
        "bias": 0.0,
        "requoteThresh": 0.0002,
        "takeSpammers": true,
        "spammerCharge": 2
      }
    },
    "SRM": {
      "perp": {
        "charge": 0.0020,
        "sizePerc": 0.02,
        "leanCoeff": 0.0010,
        "bias": 0.0,
        "requoteThresh": 0.0002,
        "takeSpammers": true,
        "spammerCharge": 2
      }
    },
    "RAY": {
      "perp": {
        "charge": 0.0015,
        "sizePerc": 0.015,
        "leanCoeff": 0.00075,
        "bias": 0.0,
        "requoteThresh": 0.0002,
        "takeSpammers": true,
        "spammerCharge": 2
      }
    },
    "FTT": {
      "perp": {
        "charge": 0.0010,
        "sizePerc": 0.02,
        "leanCoeff": 0.0005,
        "bias": 0.0,
        "requoteThresh": 0.0002,
        "takeSpammers": true,
        "spammerCharge": 2
      }
    },
    "ADA": {
      "perp": {
        "charge": 0.0010,
        "sizePerc": 0.03,
        "leanCoeff": 0.0005,
        "bias": 0.0,
        "requoteThresh": 0.0002,
        "takeSpammers": true,
        "spammerCharge": 2
      }
    }
  }
}
  */

}
