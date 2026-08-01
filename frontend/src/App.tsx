import React, { useEffect, useRef } from "react";
import Dashboard from "./views/index";
import Market from "./views/market";
import MarketBHouse from "./views/market-bhouse";
import Header from "./components/layouts/Header/index";
import SmartContract from "./context/smc";
import AccountProvider, { useAccount } from "./context/account";
import Account from "./views/account";
import DetailHero from "./views/market/bhero-id";
import DetailHouse from "./views/market/bhouse-id";
import RankingStakeHeroes from "./views/rankings/stake-heroes";
import RankingStakeWallets from "./views/rankings/stake-wallets";
import ExplorerWallet from "./views/explorer/wallet";
import ExplorerHero from "./views/explorer/hero";
import ExplorerHouse from "./views/explorer/house";
import NotificationProvider from "./context/notification";
import { AnimatePresence } from "framer-motion";
import AnimationLoad from "./components/common/animation";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
  useLocation,
  useHistory,
  RouteProps,
} from "react-router-dom";
import {
  NETWORK_URL_PARAM,
  networkToUrlParam,
  urlParamToNetwork,
} from "./utils/config";
import "antd/dist/antd.css";
import "./App.css";

function App(): JSX.Element {
  return (
    <React.Fragment>
      <NotificationProvider>
        <AccountProvider>
          <SmartContract>
            <Router>
              <NetworkUrlSync />
              <Header />
              <div style={{ padding: 10 }}></div>
              <AnimatePresence>
                <ContentRouter />
              </AnimatePresence>
            </Router>
          </SmartContract>
        </AccountProvider>
      </NotificationProvider>
    </React.Fragment>
  );
}

// Keeps the selected network and the URL (?network=) in sync in both directions.
// Initial load is already handled by the AccountProvider seeding state from the
// URL; this handles in-app changes (dropdown/wallet) and browser back/forward.
const NetworkUrlSync: React.FC = () => {
  const location = useLocation();
  const history = useHistory();
  const { network, updateNetwork } = useAccount();
  const isFirst = useRef(true);
  const prevNetwork = useRef(network);
  const prevSearch = useRef(location.search);

  // URL -> state: follow the network in the URL (back/forward, edited links,
  // cross-network links such as a BSC hero opened from the Polygon ranking).
  useEffect(() => {
    const fromUrl = urlParamToNetwork(
      new URLSearchParams(location.search).get(NETWORK_URL_PARAM)
    );
    if (fromUrl && fromUrl !== network) {
      updateNetwork(fromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // state -> URL: keep ?network= in the URL on every page. Re-runs on location
  // changes too, so it re-asserts the param whenever a page rebuilds the query
  // string (filters, sort, pagination, auto-refresh) and drops it. This makes
  // it work for all pages without each one having to preserve the param.
  useEffect(() => {
    const networkChanged = prevNetwork.current !== network;
    prevNetwork.current = network;
    prevSearch.current = location.search;

    if (isFirst.current) {
      isFirst.current = false;
      return;
    }

    const params = new URLSearchParams(window.location.search);
    // A valid network in the URL that the state has not caught up with yet is
    // an instruction (link navigation / back-forward): let the URL -> state
    // effect follow it instead of overwriting the param with the stale state
    // value - otherwise the two effects ping-pong forever.
    const paramNetwork = urlParamToNetwork(params.get(NETWORK_URL_PARAM));
    if (!networkChanged && paramNetwork && paramNetwork !== network) {
      return;
    }

    const desired = networkToUrlParam(network);
    if (params.get(NETWORK_URL_PARAM) !== desired) {
      params.set(NETWORK_URL_PARAM, desired);
      history.replace({
        pathname: window.location.pathname,
        search: params.toString(),
        hash: window.location.hash,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [network, location.search, location.pathname]);

  return null;
};

const ContentRouter: React.FC = () => {
  const location = useLocation();
  return (
    <Switch location={location} key={location.pathname}>
      <Route exact path="/">
        <AnimationLoad>
          <Dashboard />
        </AnimationLoad>
      </Route>
      <Route exact path="/market">
        <Redirect to="/market/bhero" />
      </Route>
      <Route exact path="/market/bhero">
        <AnimationLoad>
          <Market />
        </AnimationLoad>
      </Route>
      <Route exact path="/market/bhouse">
        <AnimationLoad>
          <MarketBHouse />
        </AnimationLoad>
      </Route>
      <Route exact path="/rankings">
        <Redirect to="/rankings/stake" />
      </Route>
      <Route exact path="/rankings/stake">
        <AnimationLoad>
          <RankingStakeHeroes />
        </AnimationLoad>
      </Route>
      <Route exact path="/rankings/stake-wallets">
        <AnimationLoad>
          <RankingStakeWallets />
        </AnimationLoad>
      </Route>
      <Route exact path="/explorer">
        <Redirect to="/explorer/wallet" />
      </Route>
      <Route exact path="/explorer/wallet/:address?">
        <AnimationLoad>
          <ExplorerWallet />
        </AnimationLoad>
      </Route>
      <Route exact path="/explorer/hero/:id?">
        <AnimationLoad>
          <ExplorerHero />
        </AnimationLoad>
      </Route>
      <Route exact path="/explorer/house/:id?">
        <AnimationLoad>
          <ExplorerHouse />
        </AnimationLoad>
      </Route>
      <Route exact path="/market/bhero/:id">
        <AnimationLoad>
          <DetailHero />
        </AnimationLoad>
      </Route>
      <Route exact path="/market/bhouse/:id">
        <AnimationLoad>
          <DetailHouse />
        </AnimationLoad>
      </Route>
      <PrivateRoute path="/account">
        <Account />
      </PrivateRoute>
    </Switch>
  );
};

export default App;

interface PrivateRouteProps extends Omit<RouteProps, 'render'> {
  children: React.ReactNode;
}

function PrivateRoute({ children, ...rest }: PrivateRouteProps): JSX.Element {
  const { auth } = useAccount();
  return (
    <Route
      {...rest}
      render={({ location }) =>
        auth.logged ? (
          children
        ) : (
          <Redirect
            to={{
              pathname: "/",
              state: { from: location },
            }}
          />
        )
      }
    />
  );
}
