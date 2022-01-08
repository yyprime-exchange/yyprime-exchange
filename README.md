<div align="center">
  <h1>YY'X</h1>
</div>

## Purpose

Serum trading strategies to provide liquidity within EMA-defined bands

1. Serum trading bots that implement a specific strategy (i.e “provide liquidity 5% above and below the 30 minute moving average")

1. Users would have the ability to deposit funds into the protocol, choosing from a few reasonable choices of parameters (EMA length, market depth, etc.)

1. The strategy would ideally reference Pyth Network for pricing

## Development

### Installing

To get started first install the required build tools:

```
npm install -g yarn
```

Then bootstrap the workspace:

```
yarn
```

### Building

To build the workspace:

```
yarn build
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
