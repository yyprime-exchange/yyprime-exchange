import { useEffect, useReducer, useState } from "react";
import { usePythPrice } from "./pyth";

import { useMarkPrice } from "./useMarkPrice";

const reducer = (state: any, action: any) => {
  switch (action.type) {
    case "setHistorialPrice":
      return {
        ...state,
        historicalPythPrice: [
          ...state.historicalPythPrice,
          action.prices.pricePointPyth,
        ],
        pythConfidence: [...state.pythConfidence, action.prices.confidence],
        historicalSerumPrice: [
          ...state.historicalSerumPrice,
          action.prices.pricePointSerum,
        ],
        bestBid: [...state.bestBid, action.prices.bestBid],
        bestAsk: [...state.bestAsk, action.prices.bestAsk],
      };
    default:
      return state;
  }
};

const initialState = {
  historicalPythPrice: [],
  historicalSerumPrice: [],
  pythConfidence: [],
  bestBid: [],
  bestAsk: [],
};
export const useChart = () => {
  const [chartState, dispatch] = useReducer(reducer, initialState);
  const { price, confidence } = usePythPrice();
  const { currentMarkPrice, bestBid, bestAsk } = useMarkPrice();
  const currTime = new Date();

  // useEffect(() => {
  //   // console.log("price change")
  //   const currTime = new Date();
  //   dispatch({
  //     type: "setHistorialPrice",
  //     prices: {
  //       pricePointPyth: [currTime, price],
  //       pricePointSerum: [currTime, currentMarkPrice],
  //       confidence: [currTime, confidence],
  //       bestBid: [currTime, bestBid],
  //       bestAsk: [currTime, bestAsk],
  //     },
  //   });
  // }, [currentMarkPrice, price]);

  return { price, currentMarkPrice, confidence, bestBid, bestAsk, currTime };
};
