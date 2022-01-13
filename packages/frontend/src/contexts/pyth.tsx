import React, {useReducer} from 'react';

interface PricingContext {
    pricingMap: any
}

const initialState: PricingContext = { pricingMap: {}}
export const PythContext: any = React.createContext(initialState)

const reducer = (state: any, action: any) => {
    switch (action.type) {
      case 'setPrice':
      {
        state.pricingMap[action.productInfo.symbol] = action.productInfo.price
        return {...state}
      }
      default:
        return state;
    }
  };

export const PythProvider = (props: any) => {
    const [priceState, dispatch] = useReducer(reducer, initialState);

  return (
    <PythContext.Provider value={[priceState, dispatch]}>
      {props.children}
    </PythContext.Provider>
  );
}

export default PythProvider