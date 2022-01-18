import { Market } from '@project-serum/serum';
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
    const payer = await ((side === 'sell') ?
      this.solanaClient.getAssociatedTokenAddress(new PublicKey(this.config.baseMint), this.wallet.publicKey) :
      this.solanaClient.getAssociatedTokenAddress(new PublicKey(this.config.quoteMint), this.wallet.publicKey));

    const limitPrice = this.market.priceNumberToLots(price);
    const maxBaseQuantity = this.market.baseSizeNumberToLots(size);

    console.log(`limitPrice = ${limitPrice}`);
    console.log(`maxBaseQuantity = ${maxBaseQuantity}`);
    console.log(``);

    /*
    // TODO implement srm vault fee discount
    // const feeTier = getFeeTier(0, nativeToUi(mangoGroup.nativeSrm || 0, SRM_DECIMALS));
    const feeTier = getFeeTier(0, nativeToUi(0, 0));
    const rates = getFeeRates(feeTier);
    const maxQuoteQuantity = new BN(
      spotMarket['_decoded'].quoteLotSize.toNumber() * (1 + rates.taker),
    ).mul(
      spotMarket
        .baseSizeNumberToLots(size)
        .mul(spotMarket.priceNumberToLots(price)),
    );

    if (maxBaseQuantity.lte(ZERO_BN)) {
      throw new Error('size too small');
    }
    if (limitPrice.lte(ZERO_BN)) {
      throw new Error('invalid price');
    }
    const selfTradeBehavior = 'decrementTake';
    clientId = clientId ?? new BN(Date.now());

    const spotMarketIndex = mangoGroup.getSpotMarketIndex(spotMarket.publicKey);

    if (!mangoGroup.rootBankAccounts.filter((a) => !!a).length) {
      await mangoGroup.loadRootBanks(this.connection);
    }

    const baseRootBank = mangoGroup.rootBankAccounts[spotMarketIndex];
    const baseNodeBank = baseRootBank?.nodeBankAccounts[0];
    const quoteRootBank = mangoGroup.rootBankAccounts[QUOTE_INDEX];
    const quoteNodeBank = quoteRootBank?.nodeBankAccounts[0];

    if (!baseRootBank || !baseNodeBank || !quoteRootBank || !quoteNodeBank) {
      throw new Error('Invalid or missing banks');
    }

    const transaction = new Transaction();
    const additionalSigners: Account[] = [];
    const openOrdersKeys: { pubkey: PublicKey; isWritable: boolean }[] = [];

    // Only pass in open orders if in margin basket or current market index, and
    // the only writable account should be OpenOrders for current market index
    for (let i = 0; i < mangoAccount.spotOpenOrders.length; i++) {
      let pubkey = zeroKey;
      let isWritable = false;

      if (i === spotMarketIndex) {
        isWritable = true;

        if (mangoAccount.spotOpenOrders[spotMarketIndex].equals(zeroKey)) {
          // open orders missing for this market; create a new one now
          const openOrdersSpace = OpenOrders.getLayout(
            mangoGroup.dexProgramId,
          ).span;

          const openOrdersLamports =
            await this.connection.getMinimumBalanceForRentExemption(
              openOrdersSpace,
              'processed',
            );

          const accInstr = await createAccountInstruction(
            this.connection,
            owner.publicKey,
            openOrdersSpace,
            mangoGroup.dexProgramId,
            openOrdersLamports,
          );

          const initOpenOrders = makeInitSpotOpenOrdersInstruction(
            this.programId,
            mangoGroup.publicKey,
            mangoAccount.publicKey,
            owner.publicKey,
            mangoGroup.dexProgramId,
            accInstr.account.publicKey,
            spotMarket.publicKey,
            mangoGroup.signerKey,
          );

          const initTx = new Transaction();

          initTx.add(accInstr.instruction);
          initTx.add(initOpenOrders);

          await this.sendTransaction(initTx, owner, [accInstr.account]);

          pubkey = accInstr.account.publicKey;
        } else {
          pubkey = mangoAccount.spotOpenOrders[i];
        }
      } else if (mangoAccount.inMarginBasket[i]) {
        pubkey = mangoAccount.spotOpenOrders[i];
      }

      openOrdersKeys.push({ pubkey, isWritable });
    }

    const dexSigner = await PublicKey.createProgramAddress(
      [
        spotMarket.publicKey.toBuffer(),
        spotMarket['_decoded'].vaultSignerNonce.toArrayLike(Buffer, 'le', 8),
      ],
      spotMarket.programId,
    );

    const placeOrderInstruction = makePlaceSpotOrderInstruction(
      this.programId,
      mangoGroup.publicKey,
      mangoAccount.publicKey,
      owner.publicKey,
      mangoCache,
      spotMarket.programId,
      spotMarket.publicKey,
      spotMarket['_decoded'].bids,
      spotMarket['_decoded'].asks,
      spotMarket['_decoded'].requestQueue,
      spotMarket['_decoded'].eventQueue,
      spotMarket['_decoded'].baseVault,
      spotMarket['_decoded'].quoteVault,
      baseRootBank.publicKey,
      baseNodeBank.publicKey,
      baseNodeBank.vault,
      quoteRootBank.publicKey,
      quoteNodeBank.publicKey,
      quoteNodeBank.vault,
      mangoGroup.signerKey,
      dexSigner,
      mangoGroup.srmVault, // TODO: choose msrm vault if it has any deposits
      openOrdersKeys,
      side,
      limitPrice,
      maxBaseQuantity,
      maxQuoteQuantity,
      selfTradeBehavior,
      orderType,
      clientId,
    );
    transaction.add(placeOrderInstruction);

    if (spotMarketIndex > 0) {
      console.log(
        spotMarketIndex - 1,
        mangoAccount.spotOpenOrders[spotMarketIndex - 1].toBase58(),
        openOrdersKeys[spotMarketIndex - 1].pubkey.toBase58(),
      );
    }

    const txid = await this.sendTransaction(
      transaction,
      owner,
      additionalSigners,
    );

    // update MangoAccount to have new OpenOrders pubkey
    mangoAccount.spotOpenOrders[spotMarketIndex] =
      openOrdersKeys[spotMarketIndex].pubkey;
    mangoAccount.inMarginBasket[spotMarketIndex] = true;
    console.log(
      spotMarketIndex,
      mangoAccount.spotOpenOrders[spotMarketIndex].toBase58(),
      openOrdersKeys[spotMarketIndex].pubkey.toBase58(),
    );
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
