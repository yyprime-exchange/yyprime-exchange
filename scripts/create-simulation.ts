import * as fs from 'fs';
import { SimulationBuilder } from '../packages/yyprime-exchange-ts/lib';

const simulationBuilder: SimulationBuilder = new SimulationBuilder('localnet');

simulationBuilder.token("BTC");
simulationBuilder.token("ETH");
simulationBuilder.token("USDC");

simulationBuilder.market("BTC", "USDC");
simulationBuilder.market("ETH", "USDC");
simulationBuilder.market("SOL", "USDC");

simulationBuilder.market_maker("BTC", 2, "USDC", 100_000, {});
simulationBuilder.market_maker("ETH", 250, "USDC", 100_000, {});
simulationBuilder.market_maker("SOL", 500, "USDC", 100_000, {});

const [simulation_public, simulation_private] = simulationBuilder.build();

fs.writeFileSync('packages/frontend/src/config/simulation.json', JSON.stringify(simulation_public, null, 2));
fs.writeFileSync('scripts/simulation.json', JSON.stringify(simulation_private));
