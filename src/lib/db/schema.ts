/**
 * Data models for DC AgentPay X
 */
export interface User {
  _id?: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  loginMethod: 'metamask' | 'google';
  metamaskAddress?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Agent {
  _id?: string;
  userId: string;
  name: string;
  type: string;
  // Real Agent connection
  isReal: boolean;
  apiEndpoint?: string;
  apiKey?: string;          // encrypted
  authMethod: 'bearer' | 'basic' | 'apikey_header';
  // Wallet & balance
  walletAddress: string;
  balance: Record<string, number>;
  // Permissions
  permissions: {
    read: boolean;
    trade: boolean;
    withdraw: boolean;
  };
  // Limits
  dailyLimit: number;
  perTxLimit: number;
  // Auto-swap settings
  preferredCurrency: string;       // e.g. 'USDT', 'HTX', 'KITE'
  autoSwapLimit: number;           // max auto-swap amount per tx (USDT)
  // Status
  status: 'online' | 'offline' | 'error';
  lastHeartbeat?: number;
  createdAt: number;
  updatedAt: number;
}

export interface Payment {
  _id?: string;
  userId: string;
  agentId: string;
  agentName: string;
  isReal: boolean;
  to: string;
  token: string;
  amount: number;
  memo?: string;
  status: 'pending' | 'success' | 'failed' | 'rejected';
  txHash?: string;
  createdAt: number;
  aiDecision?: any;
}

export interface SwapRecord {
  _id?: string;
  userId: string;
  agentId: string;
  fromToken: string;
  toToken: string;
  fromAmount: number;
  toAmount: number;
  price: number;
  fee: number;
  slippage: number;
  status: 'success' | 'failed';
  txHash?: string;
  createdAt: number;
}

export interface Strategy {
  _id?: string;
  userId: string;
  agentId?: string;
  rules: {
    token: string;
    max: number;
    freq: 'per-tx' | 'daily' | 'weekly';
  }[];
  whitelist: string[];
  blacklist: string[];
  approvalThreshold: number;
  aiAssist: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface GatewayRequest {
  _id?: string;
  serviceId: string;
  amount: number;
  token: string;
  callbackUrl?: string;
  signature: string;
  status: 'open' | 'paid' | 'expired';
  createdAt: number;
}
