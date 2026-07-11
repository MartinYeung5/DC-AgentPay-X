'use client';
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { X, Wallet, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/clientStore';
import { isMetaMaskInstalled, connectMetaMask, signMessage } from '@/lib/ethers';
import { signInWithGoogle } from '@/lib/auth/googleClient';

interface Props {
  open: boolean;
  onClose: () => void;
  dict: any;
  redirectTo?: string;
}

export default function LoginModal({ open, onClose, dict, redirectTo }: Props) {
  const router = useRouter();
  const params = useParams<{ locale?: string }>();
  const locale = params?.locale || 'zh-TW';
  const { setUser } = useAuth();
  const [busy, setBusy] = useState<'' | 'metamask' | 'google'>('');
  const [error, setError] = useState('');

  if (!open) return null;

  const finish = (user: any, token: string) => {
    setUser(user, token);
    try { localStorage.setItem('dc-agentpay-x-token', token); } catch {}
    onClose();
    router.push(redirectTo || `/${locale}/dashboard`);
    // Trigger a small refresh so pages relying on isAuthenticated update
    setTimeout(() => router.refresh(), 50);
  };

  // -------- MetaMask flow --------
  const loginMetaMask = async () => {
    setError(''); setBusy('metamask');
    try {
      if (!isMetaMaskInstalled()) throw new Error(dict.auth.noWallet);

      const address = await connectMetaMask();
      if (!address) throw new Error('No account returned');

      // 1) get nonce/message from server
      const nonceRes = await fetch('/api/auth/nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });
      const nonceData = await nonceRes.json();
      if (!nonceData.ok) throw new Error(nonceData.error || 'Failed to get challenge');

      // 2) user signs
      const signature = await signMessage(nonceData.message);

      // 3) verify + create session
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'metamask',
          address,
          message: nonceData.message,
          signature,
        }),
      });
      const loginData = await loginRes.json();
      if (!loginData.ok) throw new Error(loginData.error || 'Login failed');

      finish({
        id: loginData.user.id,
        email: loginData.user.email,
        name: loginData.user.name,
        loginMethod: 'metamask',
        metamaskAddress: loginData.user.metamaskAddress,
      }, loginData.token);
    } catch (e: any) {
      if (e?.code === 4001 || /reject/i.test(e?.message || '')) {
        setError('User rejected signature request');
      } else {
        setError(e?.message || 'MetaMask login failed');
      }
    } finally {
      setBusy('');
    }
  };

  // -------- Google flow --------
  const loginGoogle = async () => {
    setError(''); setBusy('google');
    try {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!clientId) {
        window.location.href = '/api/auth/google';
        return;
      }
      const idToken = await signInWithGoogle(clientId);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'google', idToken }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Google login failed');

      finish({
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        loginMethod: 'google',
      }, data.token);
    } catch (e: any) {
      setError(e?.message || 'Google login failed');
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/70 backdrop-blur-sm p-4"
         onClick={onClose}>
      <div className="card w-full max-w-md p-8 relative animate-in fade-in zoom-in-95 duration-150"
           onClick={(e) => e.stopPropagation()}>
        <button className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/5 transition"
                onClick={onClose} aria-label="Close">
          <X size={18} className="text-white/60" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-fuchsia-500 mb-4 shadow-soft">
            <ShieldCheck size={26} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">{dict.common.login}</h2>
          <p className="text-white/50 text-sm mt-1">{dict.auth.subtitle}</p>
        </div>

        <div className="space-y-3">
          <button
            className="w-full btn-primary py-3 text-base"
            onClick={loginMetaMask}
            disabled={busy !== ''}
          >
            {busy === 'metamask'
              ? <><Loader2 className="animate-spin" size={18} /> {dict.auth.connecting}</>
              : <><Wallet size={18} /> {dict.auth.metamask}</>}
          </button>

          <div className="flex items-center gap-3 text-xs text-white/40 py-1">
            <div className="flex-1 h-px bg-white/10" />
            <span>{dict.auth.or}</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <button
            className="w-full btn-outline py-3 text-base"
            onClick={loginGoogle}
            disabled={busy !== ''}
          >
            {busy === 'google' ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {dict.auth.google}
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-white/5 text-center text-[11px] text-white/40">
          By continuing, you agree to our Terms & Privacy Policy.
        </div>
      </div>
    </div>
  );
}
