import React, { useReducer } from 'react'

interface PricingContext {
  productInfoMap: any
}

const initialState: PricingContext = { productInfoMap: {} }
export const PythContext: any = React.createContext(initialState)

const reducer = (state: any, action: any) => {
  switch (action.type) {
    case 'setProductInfo': {
      state.productInfoMap[action.productInfo.symbol] = { 'price': action.productInfo.price, 'confidence': action.productInfo.confidence}
      return { ...state }
    }
    default:
      return state
  }
}

export const PythProvider = (props: any) => {
  const [priceState, dispatch] = useReducer(reducer, initialState)

  return (
    <PythContext.Provider value={[priceState, dispatch]}>
      {props.children}
    </PythContext.Provider>
  )
}

export default PythProvider
