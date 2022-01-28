import { useEffect, useReducer, useState } from "react";
import { usePythPrice } from "./pyth";

import { useMarkPrice } from "./useMarkPrice";

export const useChart = () => {
  const { price, confidence } = usePythPrice();
  const { currentMarkPrice, bestBid, bestAsk } = useMarkPrice();
  const currTime = new Date();

  return { price, currentMarkPrice, confidence, bestBid, bestAsk, currTime };
};
