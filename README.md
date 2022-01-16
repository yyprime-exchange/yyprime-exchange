<div align="center">
  <h1>YY'X</h1>
</div>

## Purpose

Serum trading strategies to provide liquidity within EMA-defined bands

1. Serum trading bots that implement a specific strategy (i.e “provide liquidity 5% above and below the 30 minute moving average")

1. Users would have the ability to deposit funds into the protocol, choosing from a few reasonable choices of parameters (EMA length, market depth, etc.)

1. The strategy would ideally reference Pyth Network for pricing

1. Solana is likely the only blockchain robust enough to support orderbooks.  

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

Then bootstrap the workspace in root:

```
yarn
```

### Building trading strategies program

Build yyprime_program package:

```
yarn yyx-program:build
```

### Building Frontend

Build yyprime_program package:

```
yarn frontend:build
yarn frontend:start

```

### Testing

To run all tests:

```
yarn test
```

### Linting

To lint:

```
yarn lint
```

# Attribution

**The strenght of the Solana ecosystem derives from the Open Source contributions of its participants. If we have created something useful, it is by standing on the shoulders of giants. Without the Open Source community yyprime would not have been possible.**

## Projects

- *Mango*

Mango is the GOAT. The Mango code is well designed, well written, and easy to read. If you want to understand the Serum DEX this is a great starting point.

https://github.com/blockworks-foundation/mango-client-v3

- *Serum*

Putting an order book on-chain is truly revolutionary. Thank you for providing the tools to make it work including the Serum DEX UI and the Anchor framework.

https://github.com/project-serum/serum-dex-ui
