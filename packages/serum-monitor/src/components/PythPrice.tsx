import React, { useContext, useEffect } from "react";
import { useMarket, useOrderbook, useMarkPrice } from "../utils/markets";
import usePyth from "../hooks/usePyth";

import { PythContext } from "../contexts/pyth";
import { sigFigs } from "../utils/utils";
import simulation from "../config/simulation-mainnet.json";

export const PythPrice = () => {
  const { baseCurrency } = useMarket();
  const [productInfoState, _, subscribe] = useContext(PythContext);

  useEffect(() => {
    if (!Object(productInfoState.productInfoMap).hasOwnProperty(baseCurrency)) {
      const priceOracleAddress =
        simulation.tokens.find((prod) => prod.symbol === baseCurrency)?.price ??
        "";
      if (priceOracleAddress) {
        subscribe(baseCurrency, priceOracleAddress);
      }
    }
  }, [baseCurrency]);
  
  return (
    <>
      {!baseCurrency ||
        (!Object(productInfoState.productInfoMap).hasOwnProperty(
          baseCurrency
        ) ? (
          <h2>No Market</h2>
        ) : (
          <div>
            {<h2>{productInfoState.productInfoMap[baseCurrency]["price"]}</h2>}
            <h2>
              {productInfoState.productInfoMap[baseCurrency]["confidence"]}
            </h2>
          </div>
        ))}
    </>
  );
};
