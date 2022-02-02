<div align="center">
  <h1>YY'X</h1>
</div>

## Purpose

YY'X is a protocol for Pooled Market Making to supply liquidity to Serum markets.
Users and Operators (Market Makers) should be multiple, scalable and open access.

1. Users deposit tokens into liquidity pools. Users can deposit any quantity of BTC, ETH, SOL, or USDC. In return users receive an equivalent amount of deposit tokens. Users can redeem their deposit tokens at any time.

1. Market Makers run the liquidity pools. They convert the tokens in the liquidity pools to Serum orders and place them on the order book. By providing liquidity the market makers earn a return over time which is equal to the spread paid by takers minus trading costs. The returns earned from market making are then split between the market makers and the liquidity pool participants.

1. The Market Making bots use the Pyth Price feed as a reference price to avoid adverse selection resulting in impermanent loss for liquidity providers.

## Development

### Installing

To get started first install the required build tools:

```
npm install -g yarn
```

Then Solana:

```
sh -c "$(curl -sSfL https://release.solana.com/v1.9.4/install)"
```

### Setting Up Development Environment

There are several scripts to run YY'X numbered in running order. 

First, to start a local validator to host the Serum DEX, in the scripts directory:

```
. 1_run_local_validator.sh
```

Once the validator is running start the UI by running:

```
. 2_run_monitor.sh
```

This will start the web server and open a new browser tab. It will take a minute to load; so go ahead and start the simulation.

```
. 3_run_simulation.sh
```

This script does several things necessary to run a simulation. First, build a simulation. This consists of generating simulation.json which contains the configuration settings for the simulation including token, faucet, market, bot, and pool accounts. Once the simulation is generated then run init-sim to initialize the Solana account state. This is the most time consuming part of the process. Then start the simulation. The bots will send orders and users can see the activity in the UI.

Once the simulation is running start the crank to settle the trades.
The crank (4) won't run without this step (3).

```
. 4_run_crank.sh
```

A full simulation requires all four of these processes to run.

# Attribution

**The strength of the Solana ecosystem derives from the Open Source contributions of its participants. If this is something useful, it is by standing on the shoulders of giants. Without the Open Source community yyprime would not have been possible.**

## Projects

- *Mango*

Mango - some say it's the GOAT. The Mango code is well designed, well written, and easy to read. To better understand the Serum DEX this is a great starting point.

https://github.com/blockworks-foundation/mango-client-v3

- *Serum*

Putting an order book on-chain is truly revolutionary. Thank you for providing the tools to make it work including the Serum DEX UI and the Anchor framework.

https://github.com/project-serum/serum-dex-ui
