/**
 * Client-side Zustand stores.
 */
'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: {
    id: string;
    email: string;
    name?: string;
    loginMethod: 'metamask' | 'google';
    metamaskAddress?: string;
  } | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: AuthState['user'], token: string) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>()(persist(
  (set) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    setUser: (user, token) => set({ user, token, isAuthenticated: true }),
    logout: () => set({ user: null, token: null, isAuthenticated: false }),
  }),
  { name: 'dc-agentpay-x-auth' }
));

interface UiState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  mode: 'demo' | 'production';
  setMode: (m: 'demo' | 'production') => void;

  // Global login modal
  loginOpen: boolean;
  loginRedirect?: string;
  openLogin: (redirect?: string) => void;
  closeLogin: () => void;
}

export const useUi = create<UiState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  mode: 'demo',
  setMode: m => set({ mode: m }),

  loginOpen: false,
  loginRedirect: undefined,
  openLogin: (redirect) => set({ loginOpen: true, loginRedirect: redirect }),
  closeLogin: () => set({ loginOpen: false, loginRedirect: undefined }),
}));
