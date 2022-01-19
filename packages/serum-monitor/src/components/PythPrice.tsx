import React, { useContext, useEffect } from 'react';
import { useMarket, useOrderbook, useMarkPrice } from '../utils/markets';
import usePyth from '../hooks/usePyth'

import { PythContext } from '../contexts/pyth'
import { sigFigs } from '../utils/utils';

 
interface PythPriceProps {
  baseCurrency: string
}

export const PythPrice: React.FC<PythPriceProps> = ({baseCurrency}) => {
    const [productInfoState, _] = useContext(PythContext)
    console.log(productInfoState, "state")
    useEffect(() => {

      if (!(productInfoState.productInfo.hasOwnProperty(baseCurrency))) { return } 
        
    },[baseCurrency])
    console.log(baseCurrency && productInfoState.productInfoMap[baseCurrency])
    debugger;
    return(<>

    {productInfoState.productInfo.hasOwnProperty(baseCurrency) ? (<h2>No Market</h2>) :
    <div>
      {productInfoState.productInfoMap.includes(baseCurrency) && <h2>{productInfoState.productInfoMap[baseCurrency]['price']}</h2> }
      {/* // <h2>{productInfoState.productInfoMap[baseCurrency]['confidence']}</h2> */}
      </div>}
    
        </>)

}