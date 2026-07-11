import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortAddr(addr: string | null | undefined, n = 6): string {
  if (!addr) return '';
  if (addr.length <= n * 2 + 2) return addr;
  return `${addr.slice(0, n)}…${addr.slice(-n)}`;
}

/** Format a number safely — accepts null / undefined / NaN / string / bigint. */
export function fmt(num: any, digits = 2): string {
  if (num === null || num === undefined || num === '') return '0';
  const n = typeof num === 'number' ? num : Number(num);
  if (!Number.isFinite(n)) return '0';
  try {
    return n.toLocaleString(undefined, { maximumFractionDigits: digits });
  } catch {
    return String(n);
  }
}

export function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

export function mockAddress(): string {
  const hex = '0123456789abcdef';
  let s = '0x';
  for (let i = 0; i < 40; i++) s += hex[Math.floor(Math.random() * 16)];
  return s;
}

export function encryptKey(key: string): string {
  if (typeof window === 'undefined') return key;
  return btoa(key);
}

export function decryptKey(encrypted: string): string {
  if (typeof window === 'undefined') return encrypted;
  try { return atob(encrypted); } catch { return encrypted; }
}
