'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getDict } from '@/i18n';
import { fmt, shortAddr } from '@/lib/utils';
import { Plus, Trash2, ExternalLink, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/clientStore';
import LoginPrompt from '@/components/LoginPrompt';
import AgentConnectForm from '@/components/AgentConnectForm';

const authHeader = (): Record<string, string> => {
  try {
    const t = typeof window !== 'undefined' ? localStorage.getItem('dc-agentpay-x-token') : null;
    return t ? { Authorization: `Bearer ${t}` } : {};
  } catch { return {}; }
};

export default function AgentsPage() {
  const { locale } = useParams<{ locale: string }>();
  const dict = getDict(locale);
  const { isAuthenticated } = useAuth();
  const [agents, setAgents] = useState<any[]>([]);
  const [connectOpen, setConnectOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/agents', { headers: authHeader() });
      if (res.ok) setAgents((await res.json()).data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { if (isAuthenticated) load(); else setLoading(false); }, [isAuthenticated]);

  const del = async (id: string) => {
    await fetch(`/api/agents/${id}`, { method: 'DELETE', headers: authHeader() });
    load();
  };

  if (!isAuthenticated) return <LoginPrompt locale={locale} dict={dict} title={dict.agents.title} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{dict.agents.title}</h1>
        <div className="flex gap-2">
          <button className="btn-primary" onClick={() => setConnectOpen(true)}>
            <Plus size={16} /> {dict.agents.connect}
          </button>
        </div>
      </div>

      <div className="card p-5">
        {loading ? (
          <div className="grid place-items-center py-10"><Loader2 className="animate-spin" size={24} color="#8B5CF6"/></div>
        ) : agents.length === 0 ? (
          <div className="text-center py-10 text-white/40">
            No agents yet. Click "{dict.agents.connect}" to get started.
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>{dict.agents.name}</th><th>{dict.agents.type}</th><th>{dict.agents.wallet}</th>
                <th>{dict.common.balance}</th><th>{dict.agents.currency}</th>
                <th>{dict.agents.autoSwapLimit}</th><th>{dict.agents.dailyLimit}</th>
                <th>{dict.agents.permissions}</th><th>{dict.common.status}</th><th>{dict.common.actions}</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((a) => (
                <tr key={a._id || a.id}>
                  <td className="font-medium">{a.name}</td>
                  <td><span className="badge-info">{a.type}</span></td>
                  <td className="text-white/60 font-mono text-xs">{shortAddr(a.walletAddress)}</td>
                  <td>
                    {Object.entries(a.balance || {}).map(([k, v]: any) => (
                      <div key={k} className="text-xs">{k}: {fmt(v)}</div>
                    ))}
                  </td>
                  <td><span className="badge">{a.preferredCurrency || 'USDT'}</span></td>
                  <td>{fmt(a.autoSwapLimit || 500)}</td>
                  <td>{fmt(a.dailyLimit || 2000)}</td>
                  <td className="text-xs">
                    {a.permissions?.read && <span className="badge-info mr-1">R</span>}
                    {a.permissions?.trade && <span className="badge-info mr-1">T</span>}
                    {a.permissions?.withdraw && <span className="badge-info">W</span>}
                  </td>
                  <td>
                    {a.isReal
                      ? <span className="badge-success">{dict.agents.realAgent}</span>
                      : <span className="badge-pending">{dict.agents.simulated}</span>}
                  </td>
                  <td>
                    <button onClick={() => del(a._id || a.id)} className="text-rose-300 hover:text-rose-200">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AgentConnectForm
        isOpen={connectOpen}
        onClose={() => setConnectOpen(false)}
        onSuccess={load}
        dict={dict}
      />
    </div>
  );
}
