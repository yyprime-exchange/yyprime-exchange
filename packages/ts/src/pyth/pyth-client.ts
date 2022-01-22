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
  tokens: Map<string, PythToken>;
  pythProgram: PublicKey;
  simulation;

  constructor(
    simulation,
  ) {
    this.cluster = simulation.config.cluster;
    this.connection = new Connection(simulation.config.pyth.url);
    this.tokens = new Map<string, PythToken>();
    simulation.tokens.forEach((token) => {
      this.tokens.set(token.price, token);
    });
    this.pythProgram = new PublicKey(simulation.config.pyth.program);
    this.simulation = simulation;
  }

  public subscribe(
    onPrice: (token: PythToken, price: PythPrice) => void
  ) {
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
              onPrice(token, { price: price.price, confidence: price.confidence });
            }
          }
        }
      },
      this.commitment,
    );
  }

  public static async query(connection: Connection, pythProgram: PublicKey) {
    const programAccounts = await connection.getProgramAccounts(pythProgram, 'processed');
    return await Promise.all(
      programAccounts.map(account => {
        const base = parseBaseData(account.account.data);
        if (base != null) {
          if (AccountType[base.type] == 'Product') {
            const product = parseProductData(account.account.data)
            return {
              productAddress: account.pubkey.toBase58(),
              priceAddress: new PublicKey(product.priceAccountKey).toBase58(),
              ...product.product,
            };
          } else {
            return undefined;
          }
        }
      }).filter(product => { return product !== undefined; })
    );
  }

}
