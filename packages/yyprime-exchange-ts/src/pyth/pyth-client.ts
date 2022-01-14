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
  parsePriceData,
  parseProductData,
} from '@pythnetwork/client'

export interface Price {
  price: number | undefined;
  confidence: number | undefined;
  priceKey: PublicKey
}

export interface Product {
  symbol: string
  baseSymbol: string
  quoteSymbol: string
  productKey: PublicKey
  priceKey: PublicKey
}

export class PythClient {
  cluster: string;
  commitment: Commitment = 'finalized';
  connection: Connection;
  onPrice: (price: Price, product: Product) => void;
  products: Map<string, Product>;
  pythProgram: PublicKey;

  constructor(
    cluster: string,
    program: string,
    url: string,
    onPrice: (price: Price, product: Product) => void,
  ) {
    this.cluster = cluster;
    this.connection = new Connection(url);
    this.onPrice = onPrice;
    this.products = new Map<string, Product>();
    this.pythProgram = new PublicKey(program);
  }

  public async subscribe() {
    (await this.connection.getProgramAccounts(this.pythProgram, this.commitment)).forEach(account => {
      const base = parseBaseData(account.account.data);
      if (base != null) {
        if (AccountType[base.type] == 'Product') {
          const product = account.pubkey;
          const productData = parseProductData(account.account.data)
          if (productData.product.quote_currency === 'USD' && productData.product.asset_type === 'Crypto') {
            this.products.set(productData.priceAccountKey.toBase58(), {
              symbol: productData.product.symbol,
              baseSymbol: productData.product.base,
              quoteSymbol: productData.product.quote_currency,
              productKey: product,
              priceKey: productData.priceAccountKey,
            });
          }
        }
      }
    });

    this.connection.onProgramAccountChange(
      this.pythProgram,
      (keyedAccountInfo: KeyedAccountInfo, context: Context) => {
        const base = parseBaseData(keyedAccountInfo.accountInfo.data);
        if (base != null) {
          if (AccountType[base.type] == 'Price') {
            const price = parsePriceData(keyedAccountInfo.accountInfo.data)
            const priceKey = keyedAccountInfo.accountId;
            const product = this.products.get(priceKey.toBase58());
            if (product) {
              this.onPrice({ price: price.price, confidence: price.confidence, priceKey: priceKey }, product);
            }
          }
        }
      },
      this.commitment,
    );
  }

  /*
  public async query() {
    let products: {}[] = [];

    const programAccounts = await this.connection.getProgramAccounts(this.pythProgram, this.commitment);
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

    / *
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
    * /

    return products;
  }
  */

}
