import { Simulator } from '../packages/yyprime-exchange-ts/lib';

import * as simulation from './simulation.json';

const simulator: Simulator = new Simulator(simulation);

simulator.initialize();

let timerId = setTimeout(function process() {
  simulator.onTime();

  timerId = setTimeout(process, 1000);
}, 1000);
