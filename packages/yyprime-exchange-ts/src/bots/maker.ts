import { Keypair } from '@solana/web3.js';
import { Market } from '@project-serum/serum';

import { Bot } from './bot';
import { PythPrice, PythToken } from '../pyth';
import { SerumBook, SerumClient } from '../serum';
import { SolanaClient } from '../solana';

export class MakerBot extends Bot {

  constructor(config: any, market: Market, serumClient: SerumClient, solanaClient: SolanaClient, wallet: Keypair) {
    super(config, market, serumClient, solanaClient, wallet);
  }

  public onAsk(book: SerumBook) {
    //console.log(JSON.stringify(book));
  }

  public onBid(book: SerumBook) {
    //console.log(JSON.stringify(book));
  }

  public onExit() {
    //TODO cancel all orders.
  }

  public onPrice(token: PythToken, price: PythPrice) {
    //console.log(JSON.stringify(token));
    //console.log(JSON.stringify(price));
    //console.log('');
  }

  private generateOrders(): void {
    //bid, ask = self.calculate_order_prices(price)
    //buy_quantity, sell_quantity = self.calculate_order_quantities(price, inventory)
  }

  /*
  def calculate_order_prices(self, price: mango.Price) -> typing.Tuple[Decimal, Decimal]:
      bid = price.mid_price - (price.mid_price * self.spread_ratio)
      ask = price.mid_price + (price.mid_price * self.spread_ratio)

      return (bid, ask)

  def calculate_order_quantities(self, price: mango.Price, inventory: typing.Sequence[typing.Optional[mango.InstrumentValue]]) -> typing.Tuple[Decimal, Decimal]:
      base_tokens: typing.Optional[mango.InstrumentValue] = mango.InstrumentValue.find_by_token(
          inventory, self.market.base)
      if base_tokens is None:
          raise Exception(f"Could not find market-maker base token {self.market.base.symbol} in inventory.")

      quote_tokens: typing.Optional[mango.InstrumentValue] = mango.InstrumentValue.find_by_token(
          inventory, self.market.quote)
      if quote_tokens is None:
          raise Exception(f"Could not find market-maker quote token {self.market.quote.symbol} in inventory.")

      buy_quantity = base_tokens.value * self.position_size_ratio
      sell_quantity = (quote_tokens.value / price.mid_price) * self.position_size_ratio
      return (buy_quantity, sell_quantity)

  def orders_require_action(self, orders: typing.Sequence[mango.Order], price: Decimal, quantity: Decimal) -> bool:
      def within_tolerance(target_value: Decimal, order_value: Decimal, tolerance: Decimal) -> bool:
          tolerated = order_value * tolerance
          return bool((order_value < (target_value + tolerated)) and (order_value > (target_value - tolerated)))
      return len(orders) == 0 or not all([(within_tolerance(price, order.price, self.existing_order_tolerance)) and within_tolerance(quantity, order.quantity, self.existing_order_tolerance) for order in orders])
  */

}
