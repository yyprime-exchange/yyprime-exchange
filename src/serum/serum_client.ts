import { Cluster, clusterApiUrl, Commitment, Connection } from '@solana/web3.js';

import SERUM_MARKETS from './markets.json';
//import SERUM_TOKENS from '../solana/tokens.json';

export class SerumClient {

  cluster: Cluster;
  commitment: Commitment = 'finalized';
  connection: Connection;

  constructor(cluster: Cluster) {
    this.cluster = cluster;
    this.connection = new Connection(clusterApiUrl(cluster));
  }

  public async subscribe() {
    //
  }

}
