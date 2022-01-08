import {
  Commitment,
  Connection,
  Context,
  KeyedAccountInfo,
  PublicKey,
} from '@solana/web3.js';
import {
  AccountType,
  parseBaseData,
  parseMappingData,
  parsePriceData,
  parseProductData,
  PriceData,
  ProductData,
} from '@pythnetwork/client'

import PYTH_PRODUCTS from './products.json';
import PYTH_PROGRAMS from './programs.json';

export interface Product {
  symbol: string
  baseSymbol: string
  quoteSymbol: string
  product: PublicKey
  price: PublicKey
}

export class PythClient {
  cluster: string;
  commitment: Commitment = 'finalized';
  connection: Connection;
  products: Map<string, Product>;
  pythProgramKey: PublicKey;

  constructor(cluster: string) {
    this.cluster = cluster;
    this.connection = new Connection(PYTH_PROGRAMS[cluster].url);

    this.products = new Map<string, Product>();
    PYTH_PRODUCTS[cluster].forEach(product => {
      this.products.set(product.price, {
        symbol: product.symbol,
        baseSymbol: product.baseSymbol,
        quoteSymbol: product.quoteSymbol,
        product: new PublicKey(product.product),
        price: new PublicKey(product.price),
      });
    });

    this.pythProgramKey = new PublicKey(PYTH_PROGRAMS[cluster].program);
  }

  public onPrice(price: PriceData, product: Product) {
    //console.log(`product = ${product.symbol}`);
    //console.log(`price = ${price.price}`);
    //console.log(`product = ${price.productAccountKey.toBase58()}`);
    //console.log(`confidence = ${price.confidence}`);
    //console.log('');
  }

  public onProduct(product: ProductData) {
  }

  // Query the products listed onchain.
  public async queryProducts() {
    let products: {}[] = [];

    const programAccounts = await this.connection.getProgramAccounts(this.pythProgramKey, this.commitment);
    programAccounts.forEach(account => {
      const base = parseBaseData(account.account.data);
      if (base != null) {
        if (AccountType[base.type] == 'Product') {
          const product = parseProductData(account.account.data)
          products.push({
            productAddress: account.pubkey.toBase58(),
            priceAddress: new PublicKey(product.priceAccountKey).toBase58(),
            ...product.product,
          });
        }
      }
    });

    /*
    const mappingAccount = await this.connection.getAccountInfo(new PublicKey(ORACLE_MAPPING_PUBLIC_KEY))
    const mappingData = parseMappingData(mappingAccount!.data)
    if (mappingData.nextMappingAccount != null) {
      throw new Error("Implement.");
    }
    for (let i = 0; i < mappingData.productAccountKeys.length; i++) {
      const productAccount = await this.connection.getAccountInfo(new PublicKey(mappingData.productAccountKeys[i]))
      const product = parseProductData(productAccount!.data)
      products.push({
        productAddress: new PublicKey(mappingData.productAccountKeys[i]).toBase58(),
        priceAddress: new PublicKey(product.priceAccountKey).toBase58(),
        ...product.product,
      });
    }
    */

    return products;
  }

  public async subscribe() {
    (await this.connection.getProgramAccounts(this.pythProgramKey, this.commitment)).forEach(account => {
      const base = parseBaseData(account.account.data);
      if (base != null) {
        if (AccountType[base.type] == 'Price') {
          const price = parsePriceData(account.account.data)
          const product = this.products.get(account.pubkey.toBase58());
          if (product) {
            this.onPrice(price, product);
          }
        }
        else if (AccountType[base.type] == 'Product') {
          const product = parseProductData(account.account.data)
          this.onProduct(product);
        }
      }
    });

    this.connection.onProgramAccountChange(
      this.pythProgramKey,
      (keyedAccountInfo: KeyedAccountInfo, context: Context) => {
        const base = parseBaseData(keyedAccountInfo.accountInfo.data);
        if (base != null) {
          if (AccountType[base.type] == 'Price') {
            const price = parsePriceData(keyedAccountInfo.accountInfo.data)
            const product = this.products.get(keyedAccountInfo.accountId.toBase58());
            if (product) {
              this.onPrice(price, product);
            }
          }
        }
      },
      this.commitment,
    );
  }

}
