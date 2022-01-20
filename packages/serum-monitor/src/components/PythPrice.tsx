import React, { useContext, useEffect } from "react";
import { useMarket, useOrderbook, useMarkPrice } from "../utils/markets";
import usePyth from "../hooks/usePyth";

import { PythContext } from "../contexts/pyth";
import { sigFigs } from "../utils/utils";
import simulation from "../config/simulation-mainnet.json";
import FloatingElement from "./layout/FloatingElement";
import { Col, Row } from "antd";


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
    <FloatingElement>
    <div>
      <h2 style={{textAlign:"center"}}>
      Live Pyth Price
      </h2>
    </div>
    {!baseCurrency ||
        (!Object(productInfoState.productInfoMap).hasOwnProperty(
          baseCurrency
        ) ? (
          <h2>No Market</h2>
        ) : (
          <div>
                 
        <Col span={12} style={{ textAlign: 'left'}}>
          Price ({productInfoState.productInfoMap[baseCurrency]["price"]})
        </Col>
        <Col span={12} style={{ textAlign: 'left' }}>
          Confidence: ({productInfoState.productInfoMap[baseCurrency]["confidence"]})
        </Col>
            {/* {<h2>{productInfoState.productInfoMap[baseCurrency]["price"]}</h2>}
            <h2>
              {productInfoState.productInfoMap[baseCurrency]["confidence"]}
            </h2> */}
          </div>
        ))}
    </FloatingElement>
     
    </>
  );
};
function styled(Row: any) {
  throw new Error("Function not implemented.");
}

