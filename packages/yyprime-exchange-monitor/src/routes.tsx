import React from 'react';
import { HashRouter, Route, Switch, Redirect } from 'react-router-dom';

import BasicLayout from './components/BasicLayout';
import MarketPage from './pages/MarketPage';

export function Routes() {
  return (
    <>
      <HashRouter basename={'/'}>
        <BasicLayout>
          <Switch>
            <Route exact path="/">
              <Redirect to={"/market/sol/usdc"} />
            </Route>
            <Route exact path="/market/:baseSymbol/:quoteSymbol">
              <MarketPage />
            </Route>
          </Switch>
        </BasicLayout>
      </HashRouter>
    </>
  );
}
