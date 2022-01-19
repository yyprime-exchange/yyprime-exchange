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
import { PythContext } from '../contexts/pyth'
import { RcFile } from 'antd/lib/upload'
const oraclePublicKey = 'BmA9Z6FjioHJPpjT39QazZyhDRUdZy2ezwx4GiDdE2u2'

const handlePriceInfo = (
  symbol: string,
  product: any,
  dispatch: any,
  accountInfo: AccountInfo<Buffer> | null,
  setSymbolMap: Function
) => {
  if (!accountInfo || !accountInfo.data) return
  const price = parsePriceData(accountInfo.data)
  dispatch({
    type: 'setProductInfo',
    productInfo: { symbol: symbol, price: price.price, confidence: price.confidence },
  })
}

export interface ISymbolMap {
  [index: string]: object
}

const usePyth: any = ({dispatch}) => {
  const connection = useConnection()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState()
  const [symbolMap, setSymbolMap] = useState<ISymbolMap>({})

  useEffect(() => {
    let cancelled = false
    const subscription_ids: number[] = []
    ;(async () => {
      try {
        const tokenPriceOracleData = simulation.tokens
        const priceInfos = await getMultipleAccounts(
          connection,
          tokenPriceOracleData.map((p) => p.price),
          'confirmed'
        )
        if (cancelled) return
        for (let i = 0; i < tokenPriceOracleData.length; i++) {
          const productData = tokenPriceOracleData[i]
          const symbol = productData.symbol
          const priceAccountKey = new PublicKey(productData.price)
          const priceInfo = priceInfos.array[i]
          handlePriceInfo(
            symbol,
            productData,
            dispatch,
            priceInfo,
            setSymbolMap
          )
          subscription_ids.push(
            connection.onAccountChange(priceAccountKey, (accountInfo) => {
              handlePriceInfo(
                symbol,
                productData,
                dispatch,
                accountInfo,
                setSymbolMap
              )
            })
          )
        }
      } catch (e) {
        if (cancelled) return
        // if (e) {
        //   setError(e);
        // }
        console.log(e)
        setIsLoading(false)
        console
          .warn
          // `Failed to fetch mapping info for ${ublicKey.toString()}`
          ()
      }
    })()
    return () => {
      cancelled = true
      for (const subscription_id of subscription_ids) {
        connection.removeAccountChangeListener(subscription_id).catch(() => {
          console.warn(
            `Unsuccessfully attempted to remove listener for subscription id ${subscription_id}`
          )
        })
      }
    }
  }, [connection, dispatch])
  return { isLoading, error, symbolMap }
}

export default usePyth
