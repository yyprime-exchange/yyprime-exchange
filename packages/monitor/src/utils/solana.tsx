import React, { useContext } from 'react';

import { useConfiguration } from './configuration';

export interface SolanaAccountContextValues {
  bots: any[],
}

const SolanaContext: React.Context<null | SolanaAccountContextValues> = React.createContext<null | SolanaAccountContextValues>(
  null,
);

export function SolanaProvider({ baseSymbol, quoteSymbol, children }) {
  const configuration = useConfiguration();
  const symbol = `${baseSymbol.toUpperCase()}/${quoteSymbol.toUpperCase()}`;
  const market = configuration.markets.find((market) => { return market.symbol === symbol; });
  const bots = (configuration.bots) ? configuration.bots.filter((bot) => { return bot.market === market.market; }) : [];
  return (
    <SolanaContext.Provider value={{ bots }} >
      {children}
    </SolanaContext.Provider>
  );
}

export function useSolanaBots() {
  const context = useContext(SolanaContext);
  if (!context) {
    throw new Error('Missing Solana context');
  }

  return context.bots.map((bot) => {
    return {
      name: bot.name,
      type: bot.type,
      baseSymbol: bot.baseSymbol,
      baseTokens: bot.baseBalance, //TODO update this.
      baseUnsettledFunds: null,
      quoteSymbol: bot.quoteSymbol,
      quoteTokens: bot.quoteBalance, //TODO update this.
      quoteUnsettledFunds: null,
  }});
}
