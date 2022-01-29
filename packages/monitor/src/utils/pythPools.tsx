import { parsePriceData } from '@pythnetwork/client'
import React, { useContext } from 'react';

//import { useConfiguration } from './configuration';
import { useAccountData } from './pythConnection';

export interface PythPoolsContextValues {
  //TODO handle prices for all of the symbols in the pools.
}

export const PythPoolsContext: React.Context<null | PythPoolsContextValues> = React.createContext<null | PythPoolsContextValues>(
  null,
);

export function PythPoolsProvider({ children }) {
  //const configuration = useConfiguration();
  return (
    <PythPoolsContext.Provider
      value={{
        //TODO
      }}
    >
      {children}
    </PythPoolsContext.Provider>
  );
}

//TODO change this to handle all prices.
export function usePythPrices(): { price: number | null | undefined; confidence: number | null | undefined } {
  const context = useContext(PythPoolsContext);
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
