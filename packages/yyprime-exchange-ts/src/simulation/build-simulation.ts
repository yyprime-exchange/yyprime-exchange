import * as fs from 'fs';
import { SimulationBuilder } from './simulation-builder';

const simulationBuilder: SimulationBuilder = new SimulationBuilder('localnet');

if (simulationBuilder.cluster === 'mainnet') {
  const [simulation_public] = simulationBuilder.build();
  fs.writeFileSync('../frontend/src/config/simulation.json', JSON.stringify(simulation_public, null, 2));
} else {
  simulationBuilder.token("BTC");
  //simulationBuilder.token("ETH");
  //simulationBuilder.token("SOL");
  simulationBuilder.token("USDC");

  simulationBuilder.market("BTC", "USDC");
  //simulationBuilder.market("ETH", "USDC");
  //simulationBuilder.market("SOL", "USDC");

  simulationBuilder.market_maker("BTC_mm_0", "BTC", 2, "USDC", 100_000, {});
  //simulationBuilder.market_maker("ETH", 250, "USDC", 100_000, {});
  //simulationBuilder.market_maker("SOL", 500, "USDC", 100_000, {});

  const [simulation_public, simulation_private] = simulationBuilder.build();
  fs.writeFileSync('../frontend/src/config/simulation.json', JSON.stringify(simulation_public, null, 2));
  fs.writeFileSync('src/simulation/simulation.json', JSON.stringify(simulation_private, null, 2));
}
