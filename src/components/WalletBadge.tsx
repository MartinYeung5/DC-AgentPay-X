'use client';
import { useAuth } from '@/lib/clientStore';
import { ShieldCheck, ShieldAlert } from 'lucide-react';
import { shortAddr } from '@/lib/utils';

export default function WalletBadge() {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-600/20 border border-brand-500/30">
      <ShieldCheck size={14} className="text-emerald-400" />
      <span className="text-xs text-white/80 font-mono">
        {user.metamaskAddress ? shortAddr(user.metamaskAddress) : user.email}
      </span>
    </div>
  );
}
