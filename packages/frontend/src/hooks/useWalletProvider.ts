import { Provider } from "@project-serum/anchor";
import { useConnectedWallet, useSolana } from "@saberhq/use-solana";
import { useMemo } from "react";

export const useWalletProvider = () => {
  const wallet = useConnectedWallet();
  const { connection, connected, network, disconnect } = useSolana();

  const provider = useMemo(() => {
    if (wallet) {
      return new Provider(connection, wallet, Provider.defaultOptions());
    }
  }, [wallet, connection]);

  const walletAddress =
    wallet && (connected ? wallet.publicKey.toBase58() : undefined);

  return {
    connection,
    wallet,
    provider,
    connected,
    disconnect,
    walletNetwork: network,
    walletAddress: walletAddress,
  };
};
