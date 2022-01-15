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

export interface PythPrice {
  price: number | undefined;
  confidence: number | undefined;
}

export interface PythToken {
  symbol: string;
  mint: string;
  decimals: number;
  price: string;
}

export class PythClient {
  cluster: string;
  commitment: Commitment = 'finalized';
  connection: Connection;
  onPrice: (token: PythToken, price: PythPrice) => void;
  tokens: Map<string, PythToken>;
  pythProgram: PublicKey;
  simulation;

  constructor(
    simulation,
    onPrice: (token: PythToken, price: PythPrice) => void,
  ) {
    this.cluster = simulation.config.cluster;
    this.connection = new Connection(simulation.config.pyth.url);
    this.onPrice = onPrice;
    this.tokens = new Map<string, PythToken>();
    simulation.tokens.forEach((token) => {
      this.tokens.set(token.price, token);
    });
    this.pythProgram = new PublicKey(simulation.config.pyth.program);
    this.simulation = simulation;
  }

  public subscribe() {
    this.connection.onProgramAccountChange(
      this.pythProgram,
      (keyedAccountInfo: KeyedAccountInfo, context: Context) => {
        const base = parseBaseData(keyedAccountInfo.accountInfo.data);
        if (base != null) {
          if (AccountType[base.type] == 'Price') {
            const price = parsePriceData(keyedAccountInfo.accountInfo.data)
            const priceKey = keyedAccountInfo.accountId;
            const token = this.tokens.get(priceKey.toBase58());
            if (token) {
              this.onPrice(token, { price: price.price, confidence: price.confidence });
            }
          }
        }
      },
      this.commitment,
    );
  }



    /*
    (await this.connection.getProgramAccounts(this.pythProgram, this.commitment)).forEach(account => {
      const base = parseBaseData(account.account.data);
      if (base != null) {
        if (AccountType[base.type] == 'Product') {
          const product = account.pubkey;
          const productData = parseProductData(account.account.data)
          const priceKey = productData.priceAccountKey.toBase58();
          if (this.simulation.tokens.find((token) => { return token.price === priceKey; })) {
            this.products.set(priceKey, {
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
    */

  /*
  public static async query() {
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
