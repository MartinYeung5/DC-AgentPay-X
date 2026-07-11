'use client';
import { useState } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { useAuth, useUi } from '@/lib/clientStore';
import {
  LogOut, ShieldCheck, ChevronDown, LogIn,
} from 'lucide-react';
import { shortAddr } from '@/lib/utils';

interface Props {
  dict: any;
  variant?: 'full' | 'compact';
}

/**
 * Single "Login" button — clicking opens the global LoginModal
 * where user picks MetaMask or Google.
 */
export default function AuthButtons({ dict, variant = 'compact' }: Props) {
  const router = useRouter();
  const params = useParams<{ locale?: string }>();
  const pathname = usePathname() || '/';
  const locale = params?.locale || 'zh-TW';
  const { user, isAuthenticated, logout } = useAuth();
  const { openLogin } = useUi();
  const [menuOpen, setMenuOpen] = useState(false);

  const doLogin = () => {
    openLogin(pathname);
  };

  const handleLogout = () => {
    logout();
    try { localStorage.removeItem('dc-agentpay-x-token'); } catch {}
    setMenuOpen(false);
    router.push(`/${locale}`);
  };

  // ---- Authenticated: user menu ----
  if (isAuthenticated && user) {
    return (
      <div className="relative">
        <button
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ink-800 border border-white/10 hover:bg-ink-700 transition"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-500 to-fuchsia-500 grid place-items-center text-[11px] font-bold text-white">
            {(user.name || user.email || 'U')[0].toUpperCase()}
          </div>
          <span className="text-xs text-white/80 max-w-[160px] truncate">
            {user.metamaskAddress ? shortAddr(user.metamaskAddress) : user.email}
          </span>
          <ChevronDown size={14} className="text-white/50" />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 mt-2 w-56 card p-2 z-50">
              <div className="px-3 py-2 border-b border-white/5 mb-1">
                <div className="text-xs text-white/40">
                  {user.loginMethod === 'metamask' ? 'MetaMask' : 'Google'}
                </div>
                <div className="text-sm text-white truncate">{user.email}</div>
              </div>
              <button
                className="w-full text-left px-3 py-2 rounded-md hover:bg-white/5 text-sm"
                onClick={() => { setMenuOpen(false); router.push(`/${locale}/profile`); }}
              >
                {dict.nav.profile}
              </button>
              <button
                className="w-full text-left px-3 py-2 rounded-md hover:bg-white/5 text-sm text-rose-300 flex items-center gap-2"
                onClick={handleLogout}
              >
                <LogOut size={14} /> {dict.common.logout}
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // ---- Not authenticated ----
  if (variant === 'full') {
    // Big centered button (e.g. hero section)
    return (
      <button className="btn-primary px-6 py-3 text-base" onClick={doLogin}>
        <LogIn size={16} /> {dict.common.login}
      </button>
    );
  }

  // Compact (topbar/sidebar)
  return (
    <button className="btn-primary text-sm px-4 py-1.5" onClick={doLogin}>
      <ShieldCheck size={14} />
      {dict.common.login}
    </button>
  );
}
