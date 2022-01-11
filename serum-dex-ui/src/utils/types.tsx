import { Connection, PublicKey } from '@solana/web3.js';
import { Market } from '@project-serum/serum';

export interface ConnectionContextValues {
  endpoint: string;
  setEndpoint: (newEndpoint: string) => void;
  connection: Connection;
  sendConnection: Connection;
  availableEndpoints: EndpointInfo[];
  setCustomEndpoints: (newCustomEndpoints: EndpointInfo[]) => void;
}

export interface EndpointInfo {
  name: string;
  endpoint: string;
  custom: boolean;
}

export interface MarketInfo {
  address: PublicKey;
  name: string;
  programId: PublicKey;
  deprecated: boolean;
  quoteLabel?: string;
  baseLabel?: string;
}

export interface CustomMarketInfo {
  address: string;
  name: string;
  programId: string;
  quoteLabel?: string;
  baseLabel?: string;
}

export interface FullMarketInfo {
  address?: PublicKey;
  name?: string;
  programId?: PublicKey;
  deprecated?: boolean;
  quoteLabel?: string;
  baseLabel?: string;
  marketName?: string;
  baseCurrency?: string;
  quoteCurrency?: string;
  marketInfo?: MarketInfo;
}

export interface MarketContextValues extends FullMarketInfo {
  market: Market | undefined | null;
  setMarketAddress: (newMarketAddress: string) => void;
  customMarkets: CustomMarketInfo[];
  setCustomMarkets: (newCustomMarkets: CustomMarketInfo[]) => void;
}

export interface BonfidaTrade {
  market: string;
  size: number;
  price: number;
  orderId: string;
  time: number;
  side: string;
  feeCost: number;
  marketAddress: string;
}
