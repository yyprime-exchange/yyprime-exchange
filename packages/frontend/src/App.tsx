import BigNumber from "bignumber.js";
import React from "react";

BigNumber.config({
  EXPONENTIAL_AT: 1000,
  DECIMAL_PLACES: 80,
});

const App: React.FC = ({ children }) => {
  return (
    <>
      {children}
    </>
  );
};

export default App;
