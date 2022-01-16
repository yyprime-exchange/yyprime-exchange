import { HashRouter, Route, Switch, Redirect } from 'react-router-dom';
import React from 'react';
import BasicLayout from './components/BasicLayout';
import SerumPage from './pages/SerumPage';
import { getSerumPageUrl } from './utils/markets';

export function Routes() {
  return (
    <>
      <HashRouter basename={'/'}>
        <BasicLayout>
          <Switch>
            <Route exact path="/">
              <Redirect to={getSerumPageUrl()} />
            </Route>
            <Route exact path="/market/:marketAddress">
              <SerumPage />
            </Route>
          </Switch>
        </BasicLayout>
      </HashRouter>
    </>
  );
}
