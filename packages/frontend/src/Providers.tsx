import { WalletKitProvider } from "@gokiprotocol/walletkit";
import React from "react";
import { web3 } from "@project-serum/anchor";

const Providers: React.FC = ({ children }) => {
  const SOLANA_COMMITMENT = 'processed';
  const SOLANA_NETWORK: web3.Cluster = 'devnet';
  const RPC_URL = 'https://api.devnet.solana.com';

  return (
      <WalletKitProvider
        commitment={SOLANA_COMMITMENT}
        defaultNetwork={SOLANA_NETWORK}
        networkConfigs={{
          [SOLANA_NETWORK]: {
            name: "mainnet-beta",
            endpoint: RPC_URL,
          },
        }}
        app={{
          icon: <h2>yyprime</h2>,
          name: "yyprime",
        }}
      >
            {children}
      </WalletKitProvider>
  );
};

export default Providers;
