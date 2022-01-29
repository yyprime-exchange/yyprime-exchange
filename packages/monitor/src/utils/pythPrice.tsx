import { parsePriceData } from '@pythnetwork/client'
import React, { useContext } from 'react';
import { PublicKey } from '@solana/web3.js';

import { useConfiguration } from './configuration';
import { useAccountData } from './pythConnection';

export interface PythPriceContextValues {
  symbol?: string,
  market?: PublicKey;
  baseSymbol?: string,
  basePrice?: PublicKey;
}

export const PythPriceContext: React.Context<null | PythPriceContextValues> = React.createContext<null | PythPriceContextValues>(
  null,
);

export function PythPriceProvider({ baseSymbol, children }) {
  const configuration = useConfiguration();
  const symbol = `${baseSymbol.toUpperCase()}/USDC`;
  const market = configuration.markets.find((market) => { return market.symbol === symbol; });
  return (
    <PythPriceContext.Provider
      value={{
        symbol,
        market: new PublicKey(market!.market),
        baseSymbol,
        basePrice: new PublicKey(market!.basePrice),
      }}
    >
      {children}
    </PythPriceContext.Provider>
  );
}

export function usePythPrice(): { price: number | null | undefined; confidence: number | null | undefined } {
  const context = useContext(PythPriceContext);
  if (!context) {
    throw new Error('Missing Pyth context');
  }

  // @ts-ignore
  let priceData = useAccountData(context.basePrice);

  if (priceData) {
    const pythPrice = parsePriceData(priceData);
    return {
      price: pythPrice.price,
      confidence: pythPrice.confidence,
    };
  } else {
    return {
      price: null,
      confidence: null,
    };
  }
}
