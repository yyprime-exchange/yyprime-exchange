import tuple from 'immutable-tuple';
import React, { useContext, useEffect, useMemo, useRef } from 'react';
import { Account, AccountInfo, Connection, PublicKey } from '@solana/web3.js';

import { useConfiguration } from './configuration';
import { setCache, useAsyncData } from './fetch-loop';

const PythConnectionContext: React.Context<null | Connection> =
  React.createContext<null | Connection>(null);

export function PythConnectionProvider({ children }) {
  const configuration = useConfiguration();

  const connection = useMemo((): Connection => {
    return new Connection(configuration.config.pyth.url, 'recent');
  }, [configuration.config.pyth]);

  // The websocket library solana/web3.js uses closes its websocket connection when the subscription list
  // is empty after opening its first time, preventing subsequent subscriptions from receiving responses.
  // This is a hack to prevent the list from every getting empty
  useEffect(() => {
    const id = connection.onAccountChange(new Account().publicKey, () => {});
    return () => {
      connection.removeAccountChangeListener(id);
    };
  }, [connection]);

  useEffect(() => {
    const id = connection.onSlotChange(() => null);
    return () => {
      connection.removeSlotChangeListener(id);
    };
  }, [connection]);

  return (
    <PythConnectionContext.Provider value={connection}>
      {children}
    </PythConnectionContext.Provider>
  );
}

export function usePythConnection() {
  const connection = useContext(PythConnectionContext);
  if (!connection) {
    throw new Error('Missing Pyth connection');
  }
  return connection;
}

const accountListenerCount = new Map();

export function useAccountInfo(
  publicKey: PublicKey | undefined | null
): [AccountInfo<Buffer> | null | undefined, boolean] {
  const connection = usePythConnection();
  const cacheKey = tuple(connection, publicKey?.toBase58());
  const [accountInfo, loaded] = useAsyncData<AccountInfo<Buffer> | null>(
    async () => (publicKey ? connection.getAccountInfo(publicKey) : null),
    cacheKey,
    { refreshInterval: 60_000 }
  );
  useEffect(() => {
    if (!publicKey) {
      return;
    }
    if (accountListenerCount.has(cacheKey)) {
      let currentItem = accountListenerCount.get(cacheKey);
      ++currentItem.count;
    } else {
      let previousInfo: AccountInfo<Buffer> | null = null;
      const subscriptionId = connection.onAccountChange(publicKey, (info) => {
        if (
          !previousInfo ||
          !previousInfo.data.equals(info.data) ||
          previousInfo.lamports !== info.lamports
        ) {
          previousInfo = info;
          setCache(cacheKey, info);
        }
      });
      accountListenerCount.set(cacheKey, { count: 1, subscriptionId });
    }
    return () => {
      let currentItem = accountListenerCount.get(cacheKey);
      let nextCount = currentItem.count - 1;
      if (nextCount <= 0) {
        connection.removeAccountChangeListener(currentItem.subscriptionId);
        accountListenerCount.delete(cacheKey);
      } else {
        --currentItem.count;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);
  const previousInfoRef = useRef<AccountInfo<Buffer> | null | undefined>(null);
  if (
    !accountInfo ||
    !previousInfoRef.current ||
    !previousInfoRef.current.data.equals(accountInfo.data) ||
    previousInfoRef.current.lamports !== accountInfo.lamports
  ) {
    previousInfoRef.current = accountInfo;
  }
  return [previousInfoRef.current, loaded];
}

export function useAccountData(publicKey) {
  const [accountInfo] = useAccountInfo(publicKey);
  return accountInfo && accountInfo.data;
}
