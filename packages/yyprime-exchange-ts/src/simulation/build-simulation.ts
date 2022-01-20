import * as fs from 'fs';
import { SimulationBuilder } from './simulation-builder';

(async () => {
  const simulationBuilder: SimulationBuilder = new SimulationBuilder('mainnet');
  //const simulationBuilder: SimulationBuilder = new SimulationBuilder('localnet');

  if (simulationBuilder.cluster === 'mainnet') {
    const [simulation_public] = await simulationBuilder.build();
    fs.writeFileSync('../serum-monitor/src/config/simulation-mainnet.json', JSON.stringify(simulation_public, null, 2));
    fs.writeFileSync('src/simulation/simulation-mainnet.json', JSON.stringify(simulation_public, null, 2));
  } else {
    simulationBuilder.token("BTC", 1_000_000_000, 6);
    //simulationBuilder.token("ETH", 1_000_000_000, 6);
    //simulationBuilder.token("SOL", 1_000_000_000, 9);
    simulationBuilder.token("USDC", 1_000_000_000, 6);

    simulationBuilder.market("BTC", "USDC");
    //simulationBuilder.market("ETH", "USDC");
    //simulationBuilder.market("SOL", "USDC");

    simulationBuilder.bot("BTC_mm_0", "maker", "BTC", 10_000, "USDC", 10_000, { half_spread: 0.005 });
    //simulationBuilder.bot("ETH", "maker", 250, "USDC", 100_000, {});
    //simulationBuilder.bot("SOL", "maker", 500, "USDC", 100_000, {});

    const [simulation_public, simulation_private] = await simulationBuilder.build();
    fs.writeFileSync('../serum-monitor/src/config/simulation.json', JSON.stringify(simulation_public, null, 2));
    fs.writeFileSync('src/simulation/simulation.json', JSON.stringify(simulation_private, null, 2));
  }
})();
