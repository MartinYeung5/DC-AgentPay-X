/**
 * Ethers.js helpers for MetaMask integration (client-side only).
 */
import { ethers } from 'ethers';

/** Check if MetaMask is installed */
export function isMetaMaskInstalled(): boolean {
  return typeof window !== 'undefined' && !!window.ethereum;
}

/** Request MetaMask account connection */
export async function connectMetaMask(): Promise<string> {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask not installed');
  }
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  return accounts[0];
}

/** Sign a message with MetaMask */
export async function signMessage(message: string): Promise<string> {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return await signer.signMessage(message);
}

/** Get current chain ID */
export async function getChainId(): Promise<number> {
  return await window.ethereum.request({ method: 'eth_chainId' });
}

/** Switch to HTX Chain */
export async function switchToHTXChain(chainIdHex: string = '0x2713'): Promise<void> {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainIdHex }],
    });
  } catch (e: any) {
    // If chain not added, prompt to add it
    if (e.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: chainIdHex,
          chainName: 'HTX Chain',
          nativeCurrency: { name: 'HTX', symbol: 'HTX', decimals: 18 },
          rpcUrls: ['https://htx-mev-api.huobi.com'],
          blockExplorerUrls: ['https://www.htx.com/explore'],
        }],
      });
    } else {
      throw e;
    }
  }
}

/** Get connected address */
export async function getConnectedAddress(): Promise<string | null> {
  if (!isMetaMaskInstalled()) return null;
  const accounts = await window.ethereum.request({ method: 'eth_accounts' });
  return accounts[0] || null;
}

/** Listen for account changes */
export function onAccountsChanged(callback: (address: string | null) => void): void {
  if (!isMetaMaskInstalled()) return;
  window.ethereum.on('accountsChanged', (accounts: string[]) => {
    callback(accounts[0] || null);
  });
}

/** Listen for chain changes */
export function onChainChanged(callback: (chainId: string) => void): void {
  if (!isMetaMaskInstalled()) return;
  window.ethereum.on('chainChanged', callback);
}
