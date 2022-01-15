import { PythPrice, PythToken, PythClient } from '../pyth';
import { SerumBook, SerumClient } from '../serum';
import { SolanaClient } from '../solana';

import * as simulation from './simulation.json';

console.log(`Monitoring simulation on ${simulation.config.cluster}`);





//console.log(`mint balance = ${JSON.stringify(await this.solanaClient.getBalance(mint.publicKey))}`);
//console.log(`mint supply = ${JSON.stringify(await this.solanaClient.getMintSupply(mint.publicKey, token.decimals))}`);
//console.log(`mint token accounts = ${JSON.stringify(await this.solanaClient.getTokenAccountsByOwner(mint.publicKey))}`);
//console.log(`faucet balance = ${JSON.stringify(await this.solanaClient.getBalance(faucet.publicKey))}`);
//console.log(`faucet token accounts = ${JSON.stringify(await this.solanaClient.getTokenAccountsByOwner(faucet.publicKey))}`);

//getTokenBalance


//TODO
/*
connection.onAccountChange(
  wallet.publicKey(),
  ( updatedAccountInfo, context ) => console.log( 'Updated account info: ', updatedAccountInfo ),
  'confirmed',
);
*/




const pythClient: PythClient = new PythClient(
  simulation,
  (token: PythToken, price: PythPrice) => {
    console.log(`[PRICE]`);
    console.log(`product = ${token.symbol}`);
    console.log(`price = ${price.price}`);
    console.log(`confidence = ${price.confidence}`);
    console.log('');
  },
);
/*
pythClient.subscribe();
*/



const serumClient: SerumClient = new SerumClient(
  simulation,
  (book: SerumBook) => {
    console.log("ASK " + book.symbol);
  },
  (book: SerumBook) => {
    console.log("BID " + book.symbol);
  },
);
/*
serumClient.initialize();
serumClient.subscribe();
*/
