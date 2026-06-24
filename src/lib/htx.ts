import CryptoJS from 'crypto-js';

/**
 * HTX (Huobi) API signature helper.
 * Docs: https://huobiapi.github.io/docs/spot/v1/en/
 * Signature: HMAC-SHA256( METHOD\nHOST\nPATH\nSortedQueryString , SecretKey )
 */
export interface HtxConfig {
  apiKey: string;
  apiSecret: string;
  baseUrl: string; // e.g. https://api-aws.huobi.pro
}

export function getHtxConfig(): HtxConfig {
  return {
    apiKey: process.env.HTX_API_KEY || '',
    apiSecret: process.env.HTX_API_SECRET || '',
    baseUrl: process.env.HTX_API_BASE || 'https://api-aws.huobi.pro',
  };
}

export function isDemoMode() {
  if (process.env.DEMO_MODE === 'false') return false;
  const cfg = getHtxConfig();
  return !cfg.apiKey || !cfg.apiSecret || process.env.DEMO_MODE === 'true';
}

function utcTimestamp() {
  // yyyy-MM-ddTHH:mm:ss
  return new Date().toISOString().replace(/\.\d{3}Z$/, '');
}

function sortedQueryString(params: Record<string, any>) {
  const keys = Object.keys(params).sort();
  return keys
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join('&');
}

export function signRequest(
  method: 'GET' | 'POST',
  path: string,
  params: Record<string, any> = {},
  cfg: HtxConfig = getHtxConfig()
) {
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

/** Public market ticker — no signature required. */
export async function getMarketTicker(symbol = 'btcusdt') {
  const cfg = getHtxConfig();
  const url = `${cfg.baseUrl}/market/detail/merged?symbol=${symbol}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTX market ticker failed: ${res.status}`);
  return res.json();
}

/** Public symbols list */
export async function getSymbols() {
  const cfg = getHtxConfig();
  const url = `${cfg.baseUrl}/v1/common/symbols`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTX symbols failed: ${res.status}`);
  return res.json();
}

/** Signed: query accounts (requires real key). */
export async function getAccounts() {
  if (isDemoMode()) {
    return {
      status: 'ok',
      demo: true,
      data: [
        { id: 100001, type: 'spot', subtype: '', state: 'working' },
      ],
    };
  }
  const { url } = signRequest('GET', '/v1/account/accounts');
  const res = await fetch(url, { cache: 'no-store' });
  return res.json();
}
