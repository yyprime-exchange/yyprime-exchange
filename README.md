<div align="center">
  <h1>YY'X</h1>
</div>

## Purpose

YY'X is a protocol that uses Pooled Market Making to supply liquidity to Serum markets.

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

```
yarn 
cd scripts
bash run_install_deps_to_start.sh
```

The monitor should display YY'X charts.




# Attribution

**The strenght of the Solana ecosystem derives from the Open Source contributions of its participants. If we have created something useful, it is by standing on the shoulders of giants. Without the Open Source community yyprime would not have been possible.**

## Projects

- *Mango*

Mango is the GOAT. The Mango code is well designed, well written, and easy to read. If you want to understand the Serum DEX this is a great starting point.

https://github.com/blockworks-foundation/mango-client-v3

- *Serum*

Putting an order book on-chain is truly revolutionary. Thank you for providing the tools to make it work including the Serum DEX UI and the Anchor framework.

https://github.com/project-serum/serum-dex-ui
