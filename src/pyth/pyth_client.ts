import { Cluster, clusterApiUrl, Commitment, Connection, Context, KeyedAccountInfo, PublicKey } from '@solana/web3.js';
import { AccountType, getPythProgramKeyForCluster, parseBaseData, parseMappingData, parsePriceData, parseProductData, PriceData, ProductData } from '@pythnetwork/client'

import PYTH_PRODUCTS from './products.json';

export class PythClient {

  cluster: Cluster;
  commitment: Commitment = 'finalized';
  connection: Connection;
  pythProgramKey: PublicKey;

  constructor(cluster: Cluster) {
    this.cluster = cluster;
    this.pythProgramKey = getPythProgramKeyForCluster(cluster);
    this.connection = new Connection(clusterApiUrl(cluster));
  }

  public getProducts() {
    return PYTH_PRODUCTS;
  }

  public on_price(price: PriceData, context: Context | null) {
  }

  public on_product(product: ProductData) {
  }

  public async subscribe() {
    const programAccounts = await this.connection.getProgramAccounts(this.pythProgramKey, this.commitment);
    programAccounts.forEach(account => {
      const base = parseBaseData(account.account.data);
      if (base != null) {
        if (AccountType[base.type] == 'Price') {
          const price = parsePriceData(account.account.data)
          this.on_price(price, null);
        }
        else if (AccountType[base.type] == 'Product') {
          const product = parseProductData(account.account.data)
          this.on_product(product);
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
            this.on_price(price, context);
          }
        }
      },
      this.commitment,
    );
  }

}
