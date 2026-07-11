/**
 * HTX API Client — supports both mainnet and testnet.
 * Uses HMAC-SHA256 signing per official docs.
 */
import CryptoJS from 'crypto-js';
import axios from 'axios';

export interface HtxConfig {
  apiKey: string;
  apiSecret: string;
  baseUrl: string;
  testnet?: boolean;
}

export function getHtxConfig(): HtxConfig {
  return {
    apiKey: process.env.HTX_API_KEY || '',
    apiSecret: process.env.HTX_API_SECRET || '',
    baseUrl: process.env.HTX_API_BASE || 'https://api-aws.huobi.pro',
    testnet: process.env.HTX_TESTNET !== 'false',
  };
}

export function isDemoMode(): boolean {
  if (process.env.DEMO_MODE === 'false') return false;
  const cfg = getHtxConfig();
  return !cfg.apiKey || !cfg.apiSecret || process.env.DEMO_MODE === 'true';
}

function utcTimestamp(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, '');
}

function sortedQueryString(params: Record<string, any>): string {
  const keys = Object.keys(params).sort();
  return keys.map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join('&');
}

export function signRequest(
  method: 'GET' | 'POST',
  path: string,
  params: Record<string, any> = {},
  cfg: HtxConfig = getHtxConfig()
): { url: string; signature: string; timestamp: string } {
  const host = new URL(cfg.baseUrl).host;
  const baseParams = {
    AccessKeyId: cfg.apiKey,
    SignatureMethod: 'HmacSHA256',
    SignatureVersion: '2',
    Timestamp: utcTimestamp(),
    ...params,
  };
  const qs = sortedQueryString(baseParams);
  const payload = `${method}\n${host}\n${path}\n${qs}`;
  const sig = CryptoJS.HmacSHA256(payload, cfg.apiSecret).toString(CryptoJS.enc.Base64);
  const url = `${cfg.baseUrl}${path}?${qs}&Signature=${encodeURIComponent(sig)}`;
  return { url, signature: sig, timestamp: baseParams.Timestamp };
}

// ---- Public APIs (no signature) ----

const http = axios.create({ timeout: 10000 });

export async function getMarketTicker(symbol: string = 'btcusdt', cfg?: HtxConfig): Promise<any> {
  const baseUrl = cfg?.baseUrl || getHtxConfig().baseUrl;
  const res = await http.get(`${baseUrl}/market/detail/merged?symbol=${symbol}`);
  return res.data;
}

export async function getSymbols(cfg?: HtxConfig): Promise<any> {
  const baseUrl = cfg?.baseUrl || getHtxConfig().baseUrl;
  const res = await http.get(`${baseUrl}/v1/common/symbols`);
  return res.data;
}

export async function getKline(symbol: string, period: string = '1min', size: number = 100, cfg?: HtxConfig): Promise<any> {
  const baseUrl = cfg?.baseUrl || getHtxConfig().baseUrl;
  const res = await http.get(`${baseUrl}/market/history/kline?symbol=${symbol}&period=${period}&size=${size}`);
  return res.data;
}

// ---- Signed APIs ----

export async function getAccounts(cfg?: HtxConfig): Promise<any> {
  if (isDemoMode()) {
    return { status: 'ok', demo: true, data: [{ id: 100001, type: 'spot', state: 'working' }] };
  }
  const { url } = signRequest('GET', '/v1/account/accounts', undefined, cfg);
  const res = await http.get(url);
  return res.data;
}

export async function getBalance(accountId: string, cfg?: HtxConfig): Promise<any> {
  if (isDemoMode()) {
    return {
      status: 'ok',
      demo: true,
      data: { id: accountId, type: 'spot', state: 'working', balance: [
        { currency: 'usdt', type: 'trade', balance: '1250.5' },
        { currency: 'htx', type: 'trade', balance: '320' },
      ]},
    };
  }
  const { url } = signRequest('GET', `/v1/account/accounts/${accountId}/balance`, undefined, cfg);
  const res = await http.get(url);
  return res.data;
}

export async function placeOrder(
  accountId: string,
  symbol: string,
  type: 'buy-limit' | 'sell-limit',
  price: string,
  amount: string,
  cfg?: HtxConfig
): Promise<any> {
  if (isDemoMode()) {
    return {
      status: 'ok',
      demo: true,
      data: {
        orderId: Math.random().toString(36).slice(2),
        symbol,
        type,
        price,
        amount,
        createdAt: Date.now(),
      },
    };
  }
  const body = {
    accountId,
    symbol,
    type,
    price,
    amount,
    'order-source': 'dc-agentpay-x',
  };
  const { url } = signRequest('POST', '/v1/order/orders/place', body, cfg);
  const res = await http.post(url, body);
  return res.data;
}

export async function createWithdraw(
  address: string,
  currency: string,
  amount: string,
  fee: string = '0',
  cfg?: HtxConfig
): Promise<any> {
  if (isDemoMode()) {
    return {
      status: 'ok',
      demo: true,
      data: {
        withdrawId: Math.random().toString(36).slice(2),
        address,
        currency,
        amount,
        status: 'pending',
      },
    };
  }
  const body = { address, currency, amount, fee };
  const { url } = signRequest('POST', '/v1/dw/withdraw-virtual/addresses', body, cfg);
  const res = await http.post(url, body);
  return res.data;
}

/** Get realtime swap rate from HTX market data */
export async function getSwapRate(fromToken: string, toToken: string): Promise<{ price: number; timestamp: number }> {
  // Normalize token names to HTX symbol format
  const normalize = (t: string) => t.toLowerCase();
  const from = normalize(fromToken);
  const to = normalize(toToken);

  // For USDT pairs, query directly
  if (to === 'usdt') {
    try {
      const ticker = await getMarketTicker(`${from}usdt`);
      const price = ticker?.tick?.close ?? 0;
      return { price: Number(price), timestamp: Date.now() };
    } catch { /* fallback */ }
  } else if (from === 'usdt') {
    try {
      const ticker = await getMarketTicker(`${to}usdt`);
      const price = ticker?.tick?.close ?? 0;
      return { price: price > 0 ? 1 / price : 0, timestamp: Date.now() };
    } catch { /* fallback */ }
  }

  // Fallback: cross-rate via USDT
  try {
    const t1 = await getMarketTicker(`${from}usdt`);
    const t2 = await getMarketTicker(`${to}usdt`);
    const p1 = t1?.tick?.close ?? 0;
    const p2 = t2?.tick?.close ?? 0;
    const cross = p1 > 0 && p2 > 0 ? p1 / p2 : 0;
    return { price: cross, timestamp: Date.now() };
  } catch {
    // Static fallback rates
    const rates: Record<string, number> = {
      'usdt-htx': 8.4, 'htx-usdt': 0.119,
      'usdt-kite': 12.3, 'kite-usdt': 0.081,
      'usdt-eth': 0.00029, 'eth-usdt': 3450,
      'usdt-btc': 0.0000148, 'btc-usdt': 67500,
    };
    const key = `${from}-${to}`;
    return { price: rates[key] || 1, timestamp: Date.now() };
  }
}
