/**
 * MetaMask login flow:
 * 1. Frontend calls window.ethereum.request({ method: 'eth_requestAccounts' })
 * 2. User signs a message (personal_sign)
 * 3. Backend verifies signature using ethers.js
 */
import { ethers } from 'ethers';

export interface MetaMaskAuthPayload {
  address: string;
  message: string;
  signature: string;
}

/** Generate a challenge message for signing */
export function buildChallengeMessage(address: string, nonce: string): string {
  return [
    `DC AgentPay X wants you to sign in with your Ethereum account:`,
    address,
    '',
    `Authenticate to access DC AgentPay X`,
    '',
    `URI: https://dc-agentpay-x.vercel.app`,
    `Version: 1`,
    `Chain ID: ${process.env.HTX_CHAIN_ID || '10243'}`,
    `Nonce: ${nonce}`,
    `Issued At: ${new Date().toISOString()}`,
  ].join('\n');
}

/** Verify MetaMask signature */
export function verifySignature(message: string, signature: string, expectedAddress: string): boolean {
  try {
    const recovered = ethers.verifyMessage(message, signature);
    return recovered.toLowerCase() === expectedAddress.toLowerCase();
  } catch {
    return false;
  }
}

/** Check if we're on HTX Testnet (or mainnet) */
export function getExpectedChainId(): number {
  // HTX Chain mainnet: 10243, Testnet varies
  return parseInt(process.env.HTX_CHAIN_ID || '10243', 10);
}

/** Derive a stable user ID from wallet address */
export function deriveUserId(address: string): string {
  return 'user_' + address.slice(2).toLowerCase();
}
