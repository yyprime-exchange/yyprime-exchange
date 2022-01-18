import { Market } from '@project-serum/serum';
import { Keypair, PublicKey } from '@solana/web3.js';

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

  //TODO replace this with an order tracker.
  ordersSent = false;

  public onPrice(token: PythToken, price: PythPrice) {
    (async () => {

      if (price.price) {

        if (!this.ordersSent) {
          this.ordersSent = true;

          const half_spread = price.price * this.config.half_spread;
          const ask_price = price.price + half_spread;
          const bid_price = price.price - half_spread;


          //TODO do these both at the same time.
          //this.placeOrder('sell', ask_price, 1, 'limit'); // this.config.baseBalance
          //this.placeOrder('buy', bid_price, 1, 'limit'); // this.config.quoteBalance





          const asks = [
            [6.041, 7.8],
            [6.051, 72.3],
            [6.055, 5.4],
            [6.067, 15.7],
            [6.077, 390.0],
            [6.09, 24.0],
            [6.11, 36.3],
            [6.133, 300.0],
            [6.167, 687.8],
          ];
          const bids = [
            [6.004, 8.5],
            [5.995, 12.9],
            [5.987, 6.2],
            [5.978, 15.3],
            [5.965, 82.8],
            [5.961, 25.4],
          ];

          for (let k = 0; k < asks.length; k += 1) {
            let ask = asks[k];
            const { transaction, signers } =
              await this.market.makePlaceOrderTransaction(this.serumClient.connection, {
                owner: this.walletAccount,
                payer: await this.solanaClient.getAssociatedTokenAddress(new PublicKey(this.config.baseMint), this.wallet.publicKey),
                side: "sell",
                price: ask[0],
                size: ask[1],
                orderType: "postOnly",
                clientId: undefined,
                openOrdersAddressKey: undefined,
                openOrdersAccount: undefined,
                feeDiscountPubkey: null,
                selfTradeBehavior: "abortTransaction",
              }
            );
            transaction.feePayer = this.wallet.publicKey;
            await this.serumClient.connection.sendTransaction(transaction, signers.concat(this.walletAccount));
          }

          for (let k = 0; k < bids.length; k += 1) {
            let bid = bids[k];
            const { transaction, signers } =
              await this.market.makePlaceOrderTransaction(this.serumClient.connection, {
                owner: this.walletAccount,
                payer: await this.solanaClient.getAssociatedTokenAddress(new PublicKey(this.config.quoteMint), this.wallet.publicKey),
                side: "buy",
                price: bid[0],
                size: bid[1],
                orderType: "postOnly",
                clientId: undefined,
                openOrdersAddressKey: undefined,
                openOrdersAccount: undefined,
                feeDiscountPubkey: null,
                selfTradeBehavior: "abortTransaction",
              }
            );
            transaction.feePayer = this.wallet.publicKey;
            await this.serumClient.connection.sendTransaction(transaction, signers.concat(this.walletAccount));
          }
        }

        //console.log(JSON.stringify(token));
        //console.log(JSON.stringify(price));
        //console.log('');
      }

    })();
  }

}
