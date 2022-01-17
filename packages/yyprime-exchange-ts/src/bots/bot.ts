import { Market } from "@project-serum/serum";
import { Account, Keypair, PublicKey, Transaction } from '@solana/web3.js';

import { PythPrice, PythToken } from '../pyth';
import { SerumBook, SerumClient } from '../serum';
import { SolanaClient } from '../solana';

export abstract class Bot {
  config: any;

  public control = {
    isRunning: true,
  };

  market: Market;

  // Maintain a list of open orders. Process ACK, FIL, and CXL.

  public position = {
    currentPosition: 0,
  };

  solanaClient: SolanaClient;
  serumClient: SerumClient;
  wallet: Keypair;
  walletAccount: Account;

  constructor(config: any, market: Market, serumClient: SerumClient, solanaClient: SolanaClient, wallet: Keypair) {
    this.config = config;
    this.market = market;
    this.serumClient = serumClient;
    this.solanaClient = solanaClient;
    this.wallet = wallet;
    this.walletAccount = new Account(this.wallet.secretKey);
  }

  public abstract onAsk(book: SerumBook);
  public abstract onBid(book: SerumBook);
  public abstract onExit();
  public abstract onPrice(token: PythToken, price: PythPrice);

  public async cancelOrder(orderId: string) {
    const orders = await this.getOrders();
    for (let order of orders) {
      if (orderId == JSON.stringify(order.orderId)) {
        await this.market.cancelOrder(this.serumClient.connection, this.walletAccount, order);
        break;
      }
    }
  }

  public async cancelAllOrders() {
    const orders = await this.getOrders();
    const transaction = new Transaction();
    //const transaction = this.market.makeMatchOrdersTransaction(5);
    orders.forEach((order) => {
      transaction.add(this.market.makeCancelOrderInstruction(this.serumClient.connection, this.wallet.publicKey, order));
    });
    //transaction.add(this.market.makeMatchOrdersTransaction(5));
    //transaction.feePayer = this.wallet.publicKey;
    return await this.serumClient.connection.sendTransaction(transaction, [this.wallet]);
  }

  public async getOrders() {
    return await this.market.loadOrdersForOwner(this.serumClient.connection, this.wallet.publicKey);
  }

  public async placeOrder(side: 'buy' | 'sell', price: number, size: number, orderType?: 'limit' | 'ioc' | 'postOnly') {
    //let formattedMinOrderSize = market?.minOrderSize?.toFixed(getDecimalCount(market.minOrderSize)) || market?.minOrderSize;
    //let formattedTickSize = market?.tickSize?.toFixed(getDecimalCount(market.tickSize)) || market?.tickSize;

    //const isIncrement = (num, step) => Math.abs((num / step) % 1) < 1e-5 || Math.abs(((num / step) % 1) - 1) < 1e-5;
    //if (!isIncrement(size, market.minOrderSize)) {
      //notify({
        //message: `Size must be an increment of ${formattedMinOrderSize}`,
        //type: 'error',
      //});
      //return;
    //}
    //if (size < market.minOrderSize) {
      //notify({ message: 'Size too small', type: 'error' });
      //return;
    //}
    //if (!isIncrement(price, market.tickSize)) {
      //notify({
        //message: `Price must be an increment of ${formattedTickSize}`,
        //type: 'error',
      //});
      //return;
    //}//
    //if (price < market.tickSize) {
      //notify({ message: 'Price under tick size', type: 'error' });
      //return;
    //}

    const payer = await ((side === 'sell') ? this.solanaClient.getAssociatedTokenAddress(this.config.baseMint, this.wallet.publicKey) : this.solanaClient.getAssociatedTokenAddress(this.config.quoteMint, this.wallet.publicKey));

    /*
    await this.market.placeOrder(this.serumClient.connection, {
      owner: this.walletAccount,
      payer,
      side,
      price,
      size,
      orderType,
      clientId: undefined,
      openOrdersAddressKey: undefined,
      openOrdersAccount: undefined,
      feeDiscountPubkey: null,
    });
    */

    const params = {
      owner: this.walletAccount,
      payer,
      side,
      price,
      size,
      orderType,
      clientId: undefined,
      openOrdersAddressKey: undefined,
      openOrdersAccount: undefined,
      feeDiscountPubkey: null,
    };

    const transaction = new Transaction();
    //const transaction = this.market.makeMatchOrdersTransaction(5);

    let { transaction: placeOrderTx, signers: placeOrderSigners } = await this.market.makePlaceOrderTransaction(
      this.serumClient.connection,
      params,
    );
    transaction.add(placeOrderTx);
    //transaction.add(this.market.makeMatchOrdersTransaction(5));
    //transaction.feePayer = this.wallet.publicKey;
    return await this.serumClient.connection.sendTransaction(transaction, [this.wallet]);
  }

}
