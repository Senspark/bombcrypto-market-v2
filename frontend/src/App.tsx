import React from "react";
import Dashboard from "./views/index";
import Market from "./views/market";
import MarketBHouse from "./views/market-bhouse";
import Header from "./components/layouts/Header/index";
import SmartContract from "./context/smc";
import AccountProvider, { useAccount } from "./context/account";
import { CartProvider } from "./context/cart";
import Account from "./views/account";
import DetailHero from "./views/market/bhero-id";
import DetailHouse from "./views/market/bhouse-id";
import NotificationProvider from "./context/notification";
import { AnimatePresence } from "framer-motion";
import AnimationLoad from "./components/common/animation";
import { ThemeProvider } from "styled-components";
import { theme } from "./styles/theme";
import { GlobalStyles } from "./styles/GlobalStyles";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
  useLocation,
  RouteProps,
} from "react-router-dom";
import "antd/dist/antd.css";
import "./App.css";

function App(): JSX.Element {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <NotificationProvider>
        <AccountProvider>
          <SmartContract>
            <CartProvider>
              <Router>
                <Header />
                <div style={{ padding: 10 }}></div>
                <AnimatePresence>
                  <ContentRouter />
                </AnimatePresence>
              </Router>
            </CartProvider>
          </SmartContract>
        </AccountProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

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
