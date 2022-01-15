import { HashRouter, Route, Switch, Redirect } from 'react-router-dom'
import TradePage from './views/TradePage'

import React from 'react'

import BasicLayout from './components/BasicLayout'

import { getTradePageUrl } from './utils/markets'
import Simulator from './views'

export function Routes() {
  return (
    <>
      <HashRouter basename={'/'}>
        <BasicLayout>
          <Switch>
            <Route exact path="/simulator">
              <Simulator />
            </Route>
            <Route exact path="/market/:marketAddress">
              <TradePage />
            </Route>
          </Switch>
        </BasicLayout>
      </HashRouter>
    </>
  )
}
