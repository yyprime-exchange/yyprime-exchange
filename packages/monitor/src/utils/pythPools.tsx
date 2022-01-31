import React, { useContext, useReducer, useEffect, useState } from "react";
import {
  parseMappingData,
  parsePriceData,
  parseProductData,
} from "@pythnetwork/client";
import { AccountInfo, PublicKey } from "@solana/web3.js";
import { useConnection, getMultipleAccounts } from "./connection";
import { useConfiguration } from "./configuration";

export interface PairName {
  base: string;
  quote: string;
}

export interface PythPoolsContextValues {
  //TODO handle prices for all of the symbols in the pools.
  // prices: PairName[]
}

export const PythPoolsContext: React.Context<any> =
  React.createContext<null | PythPoolsContextValues>(null);

const reducer = (state: any, action: any) => {
  switch (action.type) {
    case "setPrice": {
      state.pricingMap[action.productInfo.pythOracle] =
        action.productInfo.price;
      return { ...state };
    }
    default:
      return state;
  }
};

interface PricingContext {
  pricingMap: any;
}

const initialState: PricingContext = { pricingMap: {} };

export function PythPoolsProvider({ children }) {
  //const configuration = useConfiguration();
  const [priceState, dispatch] = useReducer(reducer, initialState);

  return (
    <PythPoolsContext.Provider value={[priceState, dispatch]}>
      {children}
    </PythPoolsContext.Provider>
  );
}

const handlePriceInfo = (
  priceAccountKey: string,
  symbol: string,
  product: any,
  dispatch: any,
  accountInfo: AccountInfo<Buffer> | null,
  setSymbolMap: Function
) => {
  if (!accountInfo || !accountInfo.data) return;
  const price = parsePriceData(accountInfo.data);

  dispatch({
    type: "setPrice",
    productInfo: {
      pythOracle: priceAccountKey,
      symbol: symbol,
      price: price.price,
    },
  });
};

export interface ISymbolMap {
  [index: string]: object;
}

//TODO change this to handle all prices.
export function usePythPrices() {
  const context = useContext(PythPoolsContext);
  if (!context) {
    throw new Error("Missing Pyth context");
  }
  const connection = useConnection();
  const configuration = useConfiguration();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState();
  const [numProducts, setNumProducts] = useState(0);
  const [symbolMap, setSymbolMap] = useState<ISymbolMap>({});
  const [_, dispatch] = useContext(PythPoolsContext);
  useEffect(() => {
    let cancelled = false;
    const subscription_ids: number[] = [];
    (async () => {
      try {
        const productsData = configuration.markets;
        const priceInfos = await getMultipleAccounts(
          connection,
          productsData.map((p) => p.basePrice),
          "confirmed"
        );
        if (cancelled) return;
        for (let i = 0; i < productsData.length; i++) {
          const productData = productsData[i];
          const symbol = productData.symbol;
          const priceAccountKey = new PublicKey(productData.basePrice);
          const priceInfo = priceInfos.array[i];
          handlePriceInfo(
            priceAccountKey.toBase58(),
            symbol,
            productData,
            dispatch,
            priceInfo,
            setSymbolMap
          );
          subscription_ids.push(
            connection.onAccountChange(priceAccountKey, (accountInfo) => {
              handlePriceInfo(
                priceAccountKey.toBase58(),
                symbol,
                productData,
                dispatch,
                accountInfo,
                setSymbolMap
              );
            })
          );
        }
      } catch (e) {
        if (cancelled) return;
        // if (e) {
        //   setError(e);
        // }
        console.log(e);
        setIsLoading(false);
        console
          .warn
          // `Failed to fetch mapping info for ${ublicKey.toString()}`
          ();
      }
    })();
    return () => {
      cancelled = true;
      for (const subscription_id of subscription_ids) {
        connection.removeAccountChangeListener(subscription_id).catch(() => {
          console.warn(
            `Unsuccessfully attempted to remove listener for subscription id ${subscription_id}`
          );
        });
      }
    };
  }, [connection, dispatch]);

  return { isLoading, error, numProducts, symbolMap };
}
