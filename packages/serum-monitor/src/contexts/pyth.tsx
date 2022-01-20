import React, { useReducer } from 'react'
import usePyth from '../hooks/usePyth'
import {
  parseMappingData,
  parsePriceData,
  parseProductData,
} from '@pythnetwork/client'
import { AccountInfo, PublicKey } from '@solana/web3.js'
import { useContext, useEffect, useState } from 'react'
import { getMultipleAccounts } from '../contexts/accounts'
import { useConnection } from '../contexts/connection'
import simulation from '../config/simulation-mainnet.json'
import { RcFile } from 'antd/lib/upload'
const oraclePublicKey = 'BmA9Z6FjioHJPpjT39QazZyhDRUdZy2ezwx4GiDdE2u2'

const handlePriceInfo = (
  symbol: string,
  dispatch: any,
  accountInfo: AccountInfo<Buffer> | null,
) => {
  if (!accountInfo || !accountInfo.data) return
  const price = parsePriceData(accountInfo.data)
  if (!price.price) return
  // const pricePoint: number[] = price.price]
  // console.log(pricePoint)
  dispatch({
    type: 'setHistorialPriceData',
    pricePoint: price.price,
  })
  console.log(price.price)

  dispatch({
    type: 'setProductInfo',
    productInfo: { symbol: symbol, price: price.price, confidence: price.confidence },
  })
}

export interface ISymbolMap {
  [index: string]: object
}

interface subscription {
  symbol: string
  id: number
}

// interface PythPricePoint {
//   x: BigInt
//   y: number
// }

interface PricingContext {
  productInfoMap: any
  lastSubscription: subscription
  historicalPrice: number[]
}

const initialState: PricingContext = { productInfoMap: {}, lastSubscription: {symbol: "", id: 0}, historicalPrice: []}
export const PythContext: any = React.createContext(initialState)

const reducer = (state: any, action: any) => {
  switch (action.type) {
    case 'setProductInfo': {
      state.productInfoMap[action.productInfo.symbol] = { 'price': action.productInfo.price, 'confidence': action.productInfo.confidence}
      return { ...state }
    }
    case 'setLastSub': {
      return { ...state, lastSubscription: action.lastSubscription }
    }
    case 'setHistorialPriceData':
      return { ...state, historicalPrice: [...state.historicalPrice, action.pricePoint] }
    case 'clearHistorialPriceData':
        return { ...state, historicalPrice: [] }
      
    default:
      return state
  }
}

export const PythProvider = (props: any) => {
  const [priceState, dispatch] = useReducer(reducer, initialState)
  const connection = useConnection()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState()
  const [symbolMap, setSymbolMap] = useState<ISymbolMap>({})

  const unsubscribe = async () => {
    connection.removeAccountChangeListener(priceState.lastSubscription.id).catch(() => {
      console.warn(
        `Unsuccessfully attempted to remove listener for subscription id ${priceState.lastSubscription.id}`
      )
    })
  }

  const subscribe = async (symbol, PythPriceOracleAddress) => {
    console.log(`Address: ${symbol}`)
    console.log(`PythPriceOracleAddress: ${PythPriceOracleAddress}`)
    dispatch({type: "clearHistorialPriceData"})
    if (priceState.lastSubscription.symbol 
        && priceState.lastSubscription.symbol !== symbol) {
      console.log('unsubscribing from last subscription')
      console.log(priceState.lastSubscriptionID)

      const unsub = await unsubscribe()
    }

    try {
      const priceInfo = await connection.getAccountInfo(
        new PublicKey(PythPriceOracleAddress),
        'confirmed'
      )
      
      handlePriceInfo(
        symbol,
        dispatch,
        priceInfo,
      )

      const sub_id = connection.onAccountChange(new PublicKey(PythPriceOracleAddress), (accountInfo) => {
                    handlePriceInfo(
                      symbol,
                      dispatch,
                      accountInfo,
                    )
                  })

      dispatch({type: "setLastSub", lastSubscription: {'symbol': symbol, id: sub_id}})

    } catch(error) {
      console.log(error)
      return error
    }
    
  }

  return (
    <PythContext.Provider value={[priceState, dispatch, subscribe]}>
      {props.children}
    </PythContext.Provider>
  )
}

export default PythProvider