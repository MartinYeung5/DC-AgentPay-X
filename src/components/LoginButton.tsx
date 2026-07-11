'use client';
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { LogIn, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '@/lib/clientStore';
import { shortAddr } from '@/lib/utils';
import LoginModal from './LoginModal';

interface Props {
  dict: any;
  variant?: 'primary' | 'ghost' | 'compact';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

/**
 * Unified login entry point.
 * Renders a single button. Clicking it opens LoginModal
 * where the user chooses between MetaMask / Google.
 * When authenticated, shows the user's session pill instead.
 */
export default function LoginButton({ dict, variant = 'primary', size = 'md', className = '', label }: Props) {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const params = useParams<{ locale?: string }>();
  const locale = params?.locale || 'zh-TW';
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    try { localStorage.removeItem('dc-agentpay-x-token'); } catch {}
    setMenuOpen(false);
    router.push(`/${locale}`);
  };

  // ---- Authenticated pill (used in Topbar) ----
  if (isAuthenticated && user) {
    return (
      <div className={`relative ${className}`}>
        <button
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ink-800 border border-white/10 hover:bg-ink-700 transition"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-500 to-fuchsia-500 grid place-items-center text-[11px] font-bold text-white">
            {(user.name || user.email || 'U')[0].toUpperCase()}
          </div>
          <span className="text-xs text-white/80 max-w-[140px] truncate">
            {user.metamaskAddress ? shortAddr(user.metamaskAddress) : user.email}
          </span>
          <ChevronDown size={14} className="text-white/50" />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 mt-2 w-56 card p-2 z-50">
              <div className="px-3 py-2 border-b border-white/5 mb-1">
                <div className="text-xs text-white/40">{user.loginMethod === 'metamask' ? 'MetaMask' : 'Google'}</div>
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

  // ---- Not authenticated — single button that opens the modal ----
  const sizeClasses =
    size === 'sm' ? 'text-sm px-3 py-1.5' :
    size === 'lg' ? 'text-base px-6 py-3' :
    'text-sm px-4 py-2';

  const variantClasses =
    variant === 'primary' ? 'btn-primary' :
    variant === 'ghost'   ? 'btn-ghost'   :
    'bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2 justify-center';

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`${variantClasses} ${sizeClasses} ${className}`}
      >
        <LogIn size={variant === 'compact' ? 14 : 16} />
        {label ?? dict.common.login}
      </button>
      <LoginModal open={open} onClose={() => setOpen(false)} dict={dict} />
    </>
  );
}
