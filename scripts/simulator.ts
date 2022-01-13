import { Simulator } from '../packages/yyprime-exchange-ts/lib';

import * as config from './example-0.json';

const simulator: Simulator = new Simulator(config);

simulator.start();

setInterval(() => {
  simulator.process();
}, 1000);
