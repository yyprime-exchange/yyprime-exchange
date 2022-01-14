import { PythClient } from '../packages/yyprime-exchange-ts/lib';

import * as simulation from './simulation.json';

console.log(`Monitoring simulation on ${simulation.config.cluster}`);


const pythClient: PythClient = new PythClient(simulation.config.cluster, simulation.config.pyth.program, simulation.config.pyth.url);
pythClient.subscribe();

setInterval(() => {
  //TODO

}, 1000);
