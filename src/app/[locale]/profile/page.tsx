'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getDict } from '@/i18n';
import { Wallet, Mail, ShieldCheck, Loader2, LogOut } from 'lucide-react';
import { useAuth, useUi } from '@/lib/clientStore';
import LoginPrompt from '@/components/LoginPrompt';
import { shortAddr } from '@/lib/utils';

const authHeader = (): Record<string, string> => {
  try {
    const t = typeof window !== 'undefined' ? localStorage.getItem('dc-agentpay-x-token') : null;
    return t ? { Authorization: `Bearer ${t}` } : {};
  } catch { return {}; }
};

export default function ProfilePage() {
  const { locale } = useParams<{ locale: string }>();
  const dict = getDict(locale);
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();
  const { mode, setMode } = useUi();
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }
    fetch('/api/agents', { headers: authHeader() }).then(r => r.json()).then(d => {
      setAgents(d.data || []);
      setLoading(false);
    });
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    try { localStorage.removeItem('dc-agentpay-x-token'); } catch {}
    router.push(`/${locale}`);
  };

  if (!isAuthenticated) return <LoginPrompt locale={locale} dict={dict} title={dict.profile.title} />;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">{dict.profile.title}</h1>

      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-fuchsia-500 grid place-items-center text-white text-2xl font-bold">
            {(user?.name || user?.email || 'A')[0].toUpperCase()}
          </div>
          <div>
            <div className="text-xl font-bold">{user?.name || 'Anonymous'}</div>
            <div className="text-white/60 flex items-center gap-1"><Mail size={14}/> {user?.email}</div>
            <div className="text-white/40 text-sm flex items-center gap-1 mt-1">
              <ShieldCheck size={14} className="text-emerald-400"/>
              {user?.loginMethod === 'metamask' ? 'MetaMask' : 'Google'} · {mode} mode
            </div>
          </div>
        </div>

        {user?.metamaskAddress && (
          <div className="flex items-center gap-2 p-3 bg-ink-900/60 rounded-lg">
            <Wallet size={16} className="text-brand-300"/>
            <span className="font-mono text-sm">{shortAddr(user.metamaskAddress)}</span>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button className={`btn-outline ${mode === 'demo' ? 'border-amber-500/50 text-amber-300' : 'border-emerald-500/50 text-emerald-300'}`}
            onClick={() => setMode(mode === 'demo' ? 'production' : 'demo')}>
            Switch to {mode === 'demo' ? 'Production' : 'Demo'} Mode
          </button>
          <button className="btn-ghost" onClick={handleLogout}><LogOut size={16}/> {dict.common.logout}</button>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold mb-4">{dict.profile.linkedAgents}</h3>
        {loading ? <div className="grid place-items-center py-8"><Loader2 className="animate-spin" size={24} color="#8B5CF6"/></div> :
        agents.length === 0 ? (
          <div className="text-white/40 text-center py-4">No agents linked yet.</div>
        ) : (
          <table className="table">
            <thead><tr><th>{dict.agents.name}</th><th>{dict.agents.type}</th><th>{dict.common.status}</th></tr></thead>
            <tbody>
              {agents.map((a) => (
                <tr key={a._id || a.id}>
                  <td className="font-medium">{a.name}</td>
                  <td><span className="badge-info">{a.type}</span></td>
                  <td>{a.status === 'online' ? <span className="badge-success">{dict.common.online}</span> : <span className="badge-failed">{dict.common.offline}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
