import {
  Market,
  MARKETS,
  OpenOrders,
  Orderbook,
  TOKEN_MINTS,
  TokenInstructions,
} from '@project-serum/serum'
import { PublicKey } from '@solana/web3.js'
import React, { useContext, useEffect, useState } from 'react'
import {
  divideBnToNumber,
  floorToDecimal,
  getTokenMultiplierFromDecimals,
  sleep,
  useLocalStorageState,
} from './utilsSerum'
import { refreshCache, useAsyncData } from './fetch-loop'
import { useAccountData, useAccountInfo, useConnection } from './connection'
import tuple from 'immutable-tuple'
import { notify } from './notifications'
import BN from 'bn.js'
import {
  getTokenAccountInfo,
  parseTokenAccountData,
  useMintInfos,
} from './tokens'
import {
  Balances,
  CustomMarketInfo,
  DeprecatedOpenOrdersBalances,
  FullMarketInfo,
  MarketContextValues,
  MarketInfo,
  OrderWithMarketAndMarketName,
  SelectedTokenAccounts,
  TokenAccount,
} from './types'
import { WRAPPED_SOL_MINT } from '@project-serum/serum/lib/token-instructions'
import { Order } from '@project-serum/serum/lib/market'
import BonfidaApi from './bonfidaConnector'

// Used in debugging, should be false in production
const _IGNORE_DEPRECATED = false

export const USE_MARKETS: MarketInfo[] = _IGNORE_DEPRECATED
  ? MARKETS.map((m) => ({ ...m, deprecated: false }))
  : MARKETS

export function useMarketsList() {
  return USE_MARKETS.filter(
    ({ name, deprecated }) =>
      !deprecated && !process.env.REACT_APP_EXCLUDE_MARKETS?.includes(name)
  )
}

export function useAllMarkets() {
  const connection = useConnection()
  const { customMarkets } = useCustomMarkets()

  const getAllMarkets = async () => {
    const markets: Array<{
      market: Market
      marketName: string
      programId: PublicKey
    } | null> = await Promise.all(
      getMarketInfos(customMarkets).map(async (marketInfo) => {
        try {
          const market = await Market.load(
            connection,
            marketInfo.address,
            {},
            marketInfo.programId
          )
          return {
            market,
            marketName: marketInfo.name,
            programId: marketInfo.programId,
          }
        } catch (e) {
          notify({
            message: 'Error loading all market',
            description: e.message,
            type: 'error',
          })
          return null
        }
      })
    )
    return markets.filter(
      (m): m is { market: Market; marketName: string; programId: PublicKey } =>
        !!m
    )
  }
  return useAsyncData(
    getAllMarkets,
    tuple('getAllMarkets', customMarkets.length, connection),
    { refreshInterval: _VERY_SLOW_REFRESH_INTERVAL }
  )
}

const MarketContext: React.Context<null | MarketContextValues> =
  React.createContext<null | MarketContextValues>(null)

const _VERY_SLOW_REFRESH_INTERVAL = 5000 * 1000

// For things that don't really change
const _SLOW_REFRESH_INTERVAL = 5 * 1000

// For things that change frequently
const _FAST_REFRESH_INTERVAL = 1000

export const DEFAULT_MARKET = USE_MARKETS.find(
  ({ name, deprecated }) => name === 'SRM/USDT' && !deprecated
)

export function getMarketDetails(
  market: Market | undefined | null,
  customMarkets: CustomMarketInfo[]
): FullMarketInfo {
  if (!market) {
    return {}
  }
  const marketInfos = getMarketInfos(customMarkets)
  const marketInfo = marketInfos.find((otherMarket) =>
    otherMarket.address.equals(market.address)
  )
  const baseCurrency =
    (market?.baseMintAddress &&
      TOKEN_MINTS.find((token) => token.address.equals(market.baseMintAddress))
        ?.name) ||
    (marketInfo?.baseLabel && `${marketInfo?.baseLabel}*`) ||
    'UNKNOWN'
  const quoteCurrency =
    (market?.quoteMintAddress &&
      TOKEN_MINTS.find((token) => token.address.equals(market.quoteMintAddress))
        ?.name) ||
    (marketInfo?.quoteLabel && `${marketInfo?.quoteLabel}*`) ||
    'UNKNOWN'

  return {
    ...marketInfo,
    marketName: marketInfo?.name,
    baseCurrency,
    quoteCurrency,
    marketInfo,
  }
}

export function useCustomMarkets() {
  const [customMarkets, setCustomMarkets] = useLocalStorageState<
    CustomMarketInfo[]
  >('customMarkets', [])
  return { customMarkets, setCustomMarkets }
}

export function MarketProvider({ marketAddress, setMarketAddress, children }) {
  const { customMarkets, setCustomMarkets } = useCustomMarkets()

  const address = marketAddress && new PublicKey(marketAddress)
  const connection = useConnection()
  const marketInfos = getMarketInfos(customMarkets)
  const marketInfo =
    address && marketInfos.find((market) => market.address.equals(address))

  // Replace existing market with a non-deprecated one on first load
  useEffect(() => {
    if (marketInfo && marketInfo.deprecated) {
      console.log('Switching markets from deprecated', marketInfo)
      if (DEFAULT_MARKET) {
        setMarketAddress(DEFAULT_MARKET.address.toBase58())
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [market, setMarket] = useState<Market | null>()
  useEffect(() => {
    if (
      market &&
      marketInfo &&
      // @ts-ignore
      market._decoded.ownAddress?.equals(marketInfo?.address)
    ) {
      return
    }
    setMarket(null)
    if (!marketInfo || !marketInfo.address) {
      notify({
        message: 'Error loading market',
        description: 'Please select a market from the dropdown',
        type: 'error',
      })
      return
    }
    Market.load(connection, marketInfo.address, {}, marketInfo.programId)
      .then(setMarket)
      .catch((e) =>
        notify({
          message: 'Error loading market',
          description: e.message,
          type: 'error',
        })
      )
    // eslint-disable-next-line
  }, [connection, marketInfo])

  return (
    <MarketContext.Provider
      value={{
        market,
        ...getMarketDetails(market, customMarkets),
        setMarketAddress,
        customMarkets,
        setCustomMarkets,
      }}
    >
      {children}
    </MarketContext.Provider>
  )
}

export function getTradePageUrl(marketAddress?: string) {
  if (!marketAddress) {
    const saved = localStorage.getItem('marketAddress')
    if (saved) {
      marketAddress = JSON.parse(saved)
    }
    marketAddress = marketAddress || DEFAULT_MARKET?.address.toBase58() || ''
  }
  return `/market/${marketAddress}`
}

export function useSelectedTokenAccounts(): [
  SelectedTokenAccounts,
  (newSelectedTokenAccounts: SelectedTokenAccounts) => void
] {
  const [selectedTokenAccounts, setSelectedTokenAccounts] =
    useLocalStorageState<SelectedTokenAccounts>('selectedTokenAccounts', {})
  return [selectedTokenAccounts, setSelectedTokenAccounts]
}

export function useMarket() {
  const context = useContext(MarketContext)
  if (!context) {
    throw new Error('Missing market context')
  }
  return context
}

export function useMarkPrice() {
  const [markPrice, setMarkPrice] = useState<null | number>(null)

  const [orderbook] = useOrderbook()
  const trades = useTrades()

  useEffect(() => {
    let bb = orderbook?.bids?.length > 0 && Number(orderbook.bids[0][0])
    let ba = orderbook?.asks?.length > 0 && Number(orderbook.asks[0][0])
    let last = trades && trades.length > 0 && trades[0].price

    let markPrice =
      bb && ba
        ? last
          ? [bb, ba, last].sort((a, b) => a - b)[1]
          : (bb + ba) / 2
        : null

    setMarkPrice(markPrice)
  }, [orderbook, trades])

  return markPrice
}

export function _useUnfilteredTrades(limit = 10000) {
  const { market } = useMarket()
  const connection = useConnection()
  async function getUnfilteredTrades(): Promise<any[] | null> {
    if (!market || !connection) {
      return null
    }
    return await market.loadFills(connection, limit)
  }
  const [trades] = useAsyncData(
    getUnfilteredTrades,
    tuple('getUnfilteredTrades', market, connection),
    { refreshInterval: _SLOW_REFRESH_INTERVAL }
  )
  return trades
  // NOTE: For now, websocket is too expensive since the event queue is large
  // and updates very frequently

  // let data = useAccountData(market && market._decoded.eventQueue);
  // if (!data) {
  //   return null;
  // }
  // const events = decodeEventQueue(data, limit);
  // return events
  //   .filter((event) => event.eventFlags.fill && event.nativeQuantityPaid.gtn(0))
  //   .map(market.parseFillEvent.bind(market));
}

export function useBonfidaTrades() {
  const { market } = useMarket()
  const marketAddress = market?.address.toBase58()

  async function getBonfidaTrades() {
    if (!marketAddress) {
      return null
    }
    return await BonfidaApi.getRecentTrades(marketAddress)
  }

  return useAsyncData(
    getBonfidaTrades,
    tuple('getBonfidaTrades', marketAddress),
    { refreshInterval: _SLOW_REFRESH_INTERVAL },
    false
  )
}

export function useOrderbookAccounts() {
  const { market } = useMarket()
  // @ts-ignore
  let bidData = useAccountData(market && market._decoded.bids)
  // @ts-ignore
  let askData = useAccountData(market && market._decoded.asks)
  return {
    bidOrderbook: market && bidData ? Orderbook.decode(market, bidData) : null,
    askOrderbook: market && askData ? Orderbook.decode(market, askData) : null,
  }
}

export function useOrderbook(
  depth = 20
): [{ bids: number[][]; asks: number[][] }, boolean] {
  const { bidOrderbook, askOrderbook } = useOrderbookAccounts()
  const { market } = useMarket()
  const bids =
    !bidOrderbook || !market
      ? []
      : bidOrderbook.getL2(depth).map(([price, size]) => [price, size])
  const asks =
    !askOrderbook || !market
      ? []
      : askOrderbook.getL2(depth).map(([price, size]) => [price, size])
  return [{ bids, asks }, !!bids || !!asks]
}

export function getSelectedTokenAccountForMint(
  accounts: TokenAccount[] | undefined | null,
  mint: PublicKey | undefined,
  selectedPubKey?: string | PublicKey | null
) {
  if (!accounts || !mint) {
    return null
  }
  const filtered = accounts.filter(
    ({ effectiveMint, pubkey }) =>
      mint.equals(effectiveMint) &&
      (!selectedPubKey ||
        (typeof selectedPubKey === 'string'
          ? selectedPubKey
          : selectedPubKey.toBase58()) === pubkey.toBase58())
  )
  return filtered && filtered[0]
}

export function useTrades(limit = 100) {
  const trades = _useUnfilteredTrades(limit)
  if (!trades) {
    return null
  }
  // Until partial fills are each given their own fill, use maker fills
  return trades
    .filter(({ eventFlags }) => eventFlags.maker)
    .map((trade) => ({
      ...trade,
      side: trade.side === 'buy' ? 'sell' : 'buy',
    }))
}

export function useLocallyStoredFeeDiscountKey(): {
  storedFeeDiscountKey: PublicKey | undefined
  setStoredFeeDiscountKey: (key: string) => void
} {
  const [storedFeeDiscountKey, setStoredFeeDiscountKey] =
    useLocalStorageState<string>(`feeDiscountKey`, undefined)
  return {
    storedFeeDiscountKey: storedFeeDiscountKey
      ? new PublicKey(storedFeeDiscountKey)
      : undefined,
    setStoredFeeDiscountKey,
  }
}

export function getMarketInfos(
  customMarkets: CustomMarketInfo[]
): MarketInfo[] {
  const customMarketsInfo = customMarkets.map((m) => ({
    ...m,
    address: new PublicKey(m.address),
    programId: new PublicKey(m.programId),
    deprecated: false,
  }))

  return [...customMarketsInfo, ...USE_MARKETS]
}

export function useMarketInfos() {
  const { customMarkets } = useCustomMarkets()
  return getMarketInfos(customMarkets)
}

/**
 * If selling, choose min tick size. If buying choose a price
 * s.t. given the state of the orderbook, the order will spend
 * `cost` cost currency.
 *
 * @param orderbook serum Orderbook object
 * @param cost quantity to spend. Base currency if selling,
 *  quote currency if buying.
 * @param tickSizeDecimals size of price increment of the market
 */
export function getMarketOrderPrice(
  orderbook: Orderbook,
  cost: number,
  tickSizeDecimals?: number
) {
  if (orderbook.isBids) {
    return orderbook.market.tickSize
  }
  let spentCost = 0
  let price, sizeAtLevel, costAtLevel: number
  const asks = orderbook.getL2(1000)
  for ([price, sizeAtLevel] of asks) {
    costAtLevel = price * sizeAtLevel
    if (spentCost + costAtLevel > cost) {
      break
    }
    spentCost += costAtLevel
  }
  const sendPrice = Math.min(price * 1.02, asks[0][0] * 1.05)
  let formattedPrice
  if (tickSizeDecimals) {
    formattedPrice = floorToDecimal(sendPrice, tickSizeDecimals)
  } else {
    formattedPrice = sendPrice
  }
  return formattedPrice
}

export function getExpectedFillPrice(
  orderbook: Orderbook,
  cost: number,
  tickSizeDecimals?: number
) {
  let spentCost = 0
  let avgPrice = 0
  let price, sizeAtLevel, costAtLevel: number
  for ([price, sizeAtLevel] of orderbook.getL2(1000)) {
    costAtLevel = (orderbook.isBids ? 1 : price) * sizeAtLevel
    if (spentCost + costAtLevel > cost) {
      avgPrice += (cost - spentCost) * price
      spentCost = cost
      break
    }
    avgPrice += costAtLevel * price
    spentCost += costAtLevel
  }
  const totalAvgPrice = avgPrice / Math.min(cost, spentCost)
  let formattedPrice
  if (tickSizeDecimals) {
    formattedPrice = floorToDecimal(totalAvgPrice, tickSizeDecimals)
  } else {
    formattedPrice = totalAvgPrice
  }
  return formattedPrice
}

export function useCurrentlyAutoSettling(): [
  boolean,
  (currentlyAutoSettling: boolean) => void
] {
  const [currentlyAutoSettling, setCurrentlyAutosettling] =
    useState<boolean>(false)
  return [currentlyAutoSettling, setCurrentlyAutosettling]
}
