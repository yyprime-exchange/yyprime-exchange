import React, { useContext } from 'react';
import { parsePriceData } from '@pythnetwork/client';
import { PublicKey } from '@solana/web3.js';

import { useConfiguration } from './configuration';
import { useAccountData } from './pythConnection';

export interface PythContextValues {
  symbol?: string;
  market?: PublicKey;
  baseSymbol?: string;
  basePrice?: PublicKey;
}

const PythContext: React.Context<null | PythContextValues> =
  React.createContext<null | PythContextValues>(null);

export function PythProvider({ baseSymbol, children }) {
  const configuration = useConfiguration();
  const symbol = `${baseSymbol.toUpperCase()}/USDC`;
  const market = configuration.markets.find((market) => {
    return market.symbol === symbol;
  });
  return (
    <PythContext.Provider
      value={{
        symbol,
        market: new PublicKey(market!.market),
        baseSymbol,
        basePrice: new PublicKey(market!.basePrice)
      }}
    >
      {children}
    </PythContext.Provider>
  );
}

export function usePythPrice(): {
  price: number | null | undefined;
  confidence: number | null | undefined;
} {
  const context = useContext(PythContext);
  if (!context) {
    throw new Error('Missing Pyth context');
  }

  // @ts-ignore
  let priceData = useAccountData(context.basePrice);

  if (priceData) {
    const pythPrice = parsePriceData(priceData);
    return {
      price: pythPrice.price,
      confidence: pythPrice.confidence
    };
  } else {
    return {
      price: null,
      confidence: null
    };
  }
}
