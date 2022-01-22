import React, { useContext } from 'react';

import configuration from '../config/simulation-mainnet.json';

const ConfigurationContext: React.Context<null | any> = React.createContext<null | any>(
  null,
);

export function ConfigurationProvider({ children }) {
  return (
    <ConfigurationContext.Provider
      value={ configuration }
    >
      {children}
    </ConfigurationContext.Provider>
  );
}

export function useConfiguration() {
  const configuration = useContext(ConfigurationContext);
  if (!configuration) {
    throw new Error('Missing configuration');
  }
  return configuration;
}
