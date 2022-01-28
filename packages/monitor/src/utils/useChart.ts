import { useEffect, useReducer, useState } from "react"
import { usePythPrice } from "./pyth"

import { useMarkPrice } from "./useMarkPrice"


const reducer = (state: any, action: any) => {
    switch (action.type) {
      case 'setHistorialPrice':
            return { ...state,
                    historicalPythPrice: [...state.historicalPythPrice, action.prices.pricePointPyth],
                    // pythConfidence: [...state.pythConfidence, action.prices.confidence],
                    historicalSerumPrice: [...state.historicalSerumPrice, action.prices.pricePointSerum],
                    // bestBid: [...state.bestBid, action.prices.bestBid],
                    // bestAsk: [...state.bestAsk, action.prices.bestAsk],
                }
      default:
            return state
    }
  }

const initialState = {historicalPythPrice: [], historicalSerumPrice: [],confidence: [], bestBid: [], bestAsk: []  }
export const useChart = () => {
    const [chartState, dispatch] = useReducer(reducer, initialState)
    const { price, confidence } = usePythPrice()
    const [markPrice, setMarkPrice] = useState(undefined)
    const {currentMarkPrice, bestBid, bestAsk} = useMarkPrice()

    useEffect(()=> {
        // console.log("price change")
        dispatch({"type": "setHistorialPrice", prices: {pricePointPyth: 0, pricePointSerum: currentMarkPrice, confidence: 0, bestBid: bestBid, bestAsk: bestAsk} })
    }, [currentMarkPrice])

  

    return chartState
}