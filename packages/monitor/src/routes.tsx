import React from 'react';
import { HashRouter, Route, Switch, Redirect } from 'react-router-dom';

import BasicLayout from './components/BasicLayout';
import SimulationPage from './pages/SimulationPage';

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
              <SimulationPage />
            </Route>
          </Switch>
        </BasicLayout>
      </HashRouter>
    </>
  );
}
