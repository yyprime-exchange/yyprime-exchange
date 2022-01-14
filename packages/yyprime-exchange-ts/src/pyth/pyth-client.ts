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
  PriceData,
  ProductData,
} from '@pythnetwork/client'

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
  pythProgram: PublicKey;

  constructor(
    cluster: string,
    program: string,
    url: string,
  ) {
    this.cluster = cluster;
    this.connection = new Connection(url);
    this.products = new Map<string, Product>();
    this.pythProgram = new PublicKey(program);
  }

  public onPrice(price: PriceData, product: Product) {
    //TODO callback.
    console.log(`[PRICE]`);
    console.log(`product = ${product.symbol}`);
    console.log(`price = ${price.price}`);
    console.log(`confidence = ${price.confidence}`);
    console.log('');
  }

  // Query the products listed onchain.
  public async queryProducts2() {
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
    (await this.connection.getProgramAccounts(this.pythProgram, this.commitment)).forEach(account => {
      const base = parseBaseData(account.account.data);
      if (base != null) {
        if (AccountType[base.type] == 'Price') {
          const priceData = parsePriceData(account.account.data)
          const product = this.products.get(account.pubkey.toBase58());
          if (product) {
            this.onPrice(priceData, product);
          }
        }
        else if (AccountType[base.type] == 'Product') {
          const product = account.pubkey;
          const productData = parseProductData(account.account.data)
          console.log(JSON.stringify(productData));
          this.products.set(productData.priceAccountKey.toBase58(), {
            symbol: productData.product.symbol,
            baseSymbol: productData.product.baseSymbol,
            quoteSymbol: productData.product.quote_currency,
            product: product,
            price: productData.priceAccountKey,
          });
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
