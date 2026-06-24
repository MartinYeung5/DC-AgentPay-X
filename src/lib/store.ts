/**
 * Lightweight in-memory store.
 * On Vercel serverless this is per-invocation, so we also expose a
 * client-side Zustand store for UI state. For production swap with PostgreSQL/Prisma.
 */
import { uid, mockAddress } from './utils';

export interface Agent {
  id: string;
  name: string;
  type: string;
  walletAddress: string;
  balance: Record<string, number>; // token -> amount
  dailyLimit: number;
  perTxLimit: number;
  permissions: { read: boolean; trade: boolean; withdraw: boolean };
  status: 'online' | 'offline';
  createdAt: number;
}

export interface Payment {
  id: string;
  agentId: string;
  agentName: string;
  to: string;
  token: string;
  amount: number;
  memo?: string;
  status: 'pending' | 'success' | 'failed';
  txHash?: string;
  createdAt: number;
  aiDecision?: any;
}

export interface SwapRecord {
  id: string;
  agentId: string;
  fromToken: string;
  toToken: string;
  fromAmount: number;
  toAmount: number;
  price: number;
  fee: number;
  status: 'success' | 'failed';
  createdAt: number;
}

export interface GatewayRequest {
  id: string;
  serviceId: string;
  amount: number;
  token: string;
  callbackUrl?: string;
  signature: string;
  status: 'open' | 'paid' | 'expired';
  createdAt: number;
}

class MemoryDB {
  agents: Agent[] = [];
  payments: Payment[] = [];
  swaps: SwapRecord[] = [];
  gateway: GatewayRequest[] = [];

  constructor() {
    this.seed();
  }

  seed() {
    if (this.agents.length) return;
    const seedAgents: Omit<Agent, 'id' | 'walletAddress' | 'createdAt'>[] = [
      {
        name: '數據分析 Agent',
        type: 'data',
        balance: { USDT: 1250.5, HTX: 320, ETH: 0.45 },
        dailyLimit: 500,
        perTxLimit: 100,
        permissions: { read: true, trade: true, withdraw: true },
        status: 'online',
      },
      {
        name: '購物 Agent',
        type: 'shopping',
        balance: { USDT: 800, KITE: 1500 },
        dailyLimit: 300,
        perTxLimit: 80,
        permissions: { read: true, trade: true, withdraw: false },
        status: 'online',
      },
      {
        name: '內容生成 Agent',
        type: 'content',
        balance: { USDT: 420, HTX: 100 },
        dailyLimit: 200,
        perTxLimit: 50,
        permissions: { read: true, trade: true, withdraw: false },
        status: 'offline',
      },
    ];
    seedAgents.forEach((a) =>
      this.agents.push({
        ...a,
        id: uid('agent'),
        walletAddress: mockAddress(),
        createdAt: Date.now() - Math.floor(Math.random() * 1e7),
      })
    );

    // seed payments
    for (let i = 0; i < 8; i++) {
      const ag = this.agents[i % this.agents.length];
      this.payments.push({
        id: uid('pay'),
        agentId: ag.id,
        agentName: ag.name,
        to: mockAddress(),
        token: ['USDT', 'HTX', 'KITE'][i % 3],
        amount: Math.round(Math.random() * 80 + 5),
        memo: 'API subscription',
        status: ['success', 'success', 'success', 'pending', 'failed'][i % 5] as any,
        txHash: '0x' + Math.random().toString(16).slice(2, 18),
        createdAt: Date.now() - i * 3600_000,
      });
    }
  }
}

// Module-level singleton (cached during a warm Lambda)
const g = globalThis as any;
if (!g.__agentpay_db) g.__agentpay_db = new MemoryDB();
export const db: MemoryDB = g.__agentpay_db;
