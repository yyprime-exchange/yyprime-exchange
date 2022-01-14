import { Price, Product, PythClient } from '../packages/yyprime-exchange-ts/lib';

import * as simulation from './simulation.json';

console.log(`Monitoring simulation on ${simulation.config.cluster}`);

const pythClient: PythClient = new PythClient(
  simulation.config.cluster,
  simulation.config.pyth.program,
  simulation.config.pyth.url,
  (price: Price, product: Product) => {
    console.log(`[PRICE]`);
    console.log(`product = ${product.symbol}`);
    console.log(`price = ${price.price}`);
    console.log(`confidence = ${price.confidence}`);
    console.log('');
  },
);

pythClient.subscribe();



//setInterval(() => {
  //TODO


//}, 1000);
