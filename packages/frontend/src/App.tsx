import './index.css';
import "antd/dist/antd.css";
import {
  BrowserRouter as Router,
  Route,
} from "react-router-dom";
import Simulator from './views';
import Background from '../src/components/Background'
import { SnackbarProvider } from 'notistack';
import { WalletKitProvider } from "@gokiprotocol/walletkit";
import { clusterApiUrl } from '@solana/web3.js';
import PythProvider from './contexts/pyth';
// import { ReactComponent as logo } from './assets/yyprime_logo.svg';
function App() {
  const ENDPOINTS = [
    {
      clusterPrettyName: "Mainnet",
      name: "mainnet-beta",
      url: "https://ssc-dao.genesysgo.net/",
    },
    {
      clusterPrettyName: "Testnet",
      name: "testnet",
      url: clusterApiUrl("testnet"),
    },
    {
      clusterPrettyName: "Devnet",
      name: "devnet",
      url: clusterApiUrl("devnet"),
    },
  ];
  
  return (
  //   <WalletKitProvider
  //   defaultNetwork="devnet"
  //   app={{
  //     icon: <h2>YYprime</h2>,
  //     name: "Yyprime",
  //   }}
  // >
    <PythProvider>
          <SnackbarProvider 
            maxSnack={5} 
            autoHideDuration={400}>
              
            <Router>
              <Route exact path='/' component={Simulator}/>
            </Router>
          </SnackbarProvider>
    </PythProvider>
    // </WalletKitProvider>

  );
}

export default App;
