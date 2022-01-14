import { Simulator } from '../packages/yyprime-exchange-ts/lib';

import * as simulation from './simulation.json';

const simulator: Simulator = new Simulator(simulation);

simulator.start();

setInterval(() => {
  simulator.process();
}, 1000);
