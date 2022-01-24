import React, { useContext } from 'react';

import simulation_mainnet from '../config/simulation-mainnet.json';
import simulation from '../config/simulation.json';

const ConfigurationContext: React.Context<null | any> = React.createContext<null | any>(
  null,
);

export function ConfigurationProvider({ children }) {
  return (
    <ConfigurationContext.Provider
      value={ (window.location.port === '80') ? simulation_mainnet : simulation }
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
