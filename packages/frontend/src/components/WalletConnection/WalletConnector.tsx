import { useContext, useState } from 'react';
import MobileNav from "../Navigation/mobileNav"
import {  useWalletKit, useWallet } from "@gokiprotocol/walletkit";
import { Button, Select, Tag, Tabs } from "antd";
import { useSolana } from '@saberhq/use-solana';
import { CaretDownOutlined } from '@ant-design/icons'
import { formatNumber, shortenAddress } from "../../utils/utils";


export default function ConnectorWallet() {
  const { connect } = useWalletKit();
  const { publicKey, connected } = useWallet();

  const { network, endpoint} = useSolana()
  const [isSettingsModalOpen, setSettingModal] = useState(false);
  const NetworkButton = () => {
    return(
      <>
      <button
        type="button">
          <Tag 
            style={{
              fontSize: 11,
              fontWeight: 600,
              borderRadius: 5,
            }}
            color="blue">
              {network}
          </Tag>
      </button>
      </>
    )
  }

  return (
    <div className="h-full w-full my-3 flex flex-wrap justify-between text-center">
      {!connected ? (
        <>
            {/* Connect Wallet Button */}
            <button className="walletConnect__button"
              onClick={connect}>
              Connect Wallet
            </button>
        </>
      ) :
      (
        <>
       
        <div className="cursor-pointer w-full flex flex-row items-center justify-between md:justify-center text-xs px-2 py-2 rounded-2xl transition duration-1000 border border-gray-200 bg-gray-50 hover:bg-gray-100">
        <NetworkButton/>
          <div className="flex flex-row items-center">
            <div className="flex flex-col items-start mx-2">
              <span color="black" className="text-blue text-xs font-semibold">
                {0} SOL
              </span>
              <div className="wallet-key flex flex-row items-center">
                <span className="text-xs">
                  {shortenAddress(`${publicKey?.toBase58()}`)}
                </span>
              </div>
            </div>
          </div>
          <div className="mx-2">
            <CaretDownOutlined />
          </div>
          
        </div>
     </>

      )}
    </div>
  );
  
}