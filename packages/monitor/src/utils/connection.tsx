import tuple from 'immutable-tuple';
import React, { useContext, useEffect, useMemo, useRef } from 'react';
import { Account, AccountInfo, Connection, PublicKey } from '@solana/web3.js';

import { useConfiguration } from './configuration';
import { setCache, useAsyncData } from './fetch-loop';

const ConnectionContext: React.Context<null | Connection> = React.createContext<null | Connection>(
  null,
);

export function ConnectionProvider({ children }) {
  const configuration = useConfiguration();

  const connection = useMemo((): Connection => {
    if (configuration.config.solana.https) {
      return new Connection(configuration.config.solana.https, 'recent');
    } else if (configuration.config.solana.http) {
      return new Connection(configuration.config.solana.http, 'recent');
    } else {
      throw new Error("Endpoint is not defined.");
    }
  }, [
    configuration.config.solana,
  ]);

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
    <ConnectionContext.Provider
      value={ connection }
    >
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection() {
  const connection = useContext(ConnectionContext);
  if (!connection) {
    throw new Error('Missing connection');
  }
  return connection;
}

const accountListenerCount = new Map();
export function chunks<T>(array: T[], size: number): T[][] {
  return Array.apply<number, T[], T[][]>(
    0,
    new Array(Math.ceil(array.length / size))
  ).map((_, index) => array.slice(index * size, (index + 1) * size));
}


const getMultipleAccountsCore = async (
  connection: any,
  keys: string[],
  commitment: string
) => {
  const args = connection._buildArgs([keys], commitment, "base64");

  const unsafeRes = await connection._rpcRequest("getMultipleAccounts", args);
  if (unsafeRes.error) {
    throw new Error(
      "failed to get info about account " + unsafeRes.error.message
    );
  }

  if (unsafeRes.result.value) {
    const array = unsafeRes.result.value as AccountInfo<string[]>[];
    return { keys, array };
  }

  // TODO: fix
  throw new Error();
};


export const getMultipleAccounts = async (
  connection: any,
  keys: string[],
  commitment: string
) => {
  const result = await Promise.all(
    chunks(keys, 99).map((chunk) =>
      getMultipleAccountsCore(connection, chunk, commitment)
    )
  );

  const array = result
    .map(
      (a) =>
        a.array
          .map((acc) => {
            if (!acc) {
              return undefined;
            }

            const { data, ...rest } = acc;
            const obj = {
              ...rest,
              data: Buffer.from(data[0], "base64"),
            } as AccountInfo<Buffer>;
            return obj;
          })
          .filter((_) => _) as AccountInfo<Buffer>[]
    )
    .flat();
  return { keys, array };
};


export function useAccountInfo(
  publicKey: PublicKey | undefined | null,
): [AccountInfo<Buffer> | null | undefined, boolean] {
  const connection = useConnection();
  const cacheKey = tuple(connection, publicKey?.toBase58());
  const [accountInfo, loaded] = useAsyncData<AccountInfo<Buffer> | null>(
    async () => (publicKey ? connection.getAccountInfo(publicKey) : null),
    cacheKey,
    { refreshInterval: 60_000 },
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
