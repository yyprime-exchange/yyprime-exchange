import PYTH_PRODUCTS from './pyth/products.json';
import PYTH_PROGRAMS from './pyth/programs.json';
import {
  PythClient,
  PythPrice,
  PythToken,
} from './pyth';

export {
  PYTH_PRODUCTS,
  PYTH_PROGRAMS,
  PythClient,
  PythPrice,
  PythToken,
};

import SERUM_PROGRAMS from './serum/programs.json';
import {
  SerumBook,
  SerumClient,
} from './serum';

export {
  SERUM_PROGRAMS,
  SerumBook,
  SerumClient,
};

import SOLANA_CLUSTERS from './solana/clusters.json';
import SOLANA_TOKENS from './solana/tokens.json';
import {
  SolanaClient,
} from './solana/solana-client';

export {
  SOLANA_CLUSTERS,
  SOLANA_TOKENS,
  SolanaClient,
};

export * from "./pyth"
export * from "./serum"
export * from "./solana"
