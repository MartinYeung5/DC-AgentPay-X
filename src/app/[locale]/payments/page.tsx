'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getDict } from '@/i18n';
import { fmt, shortAddr } from '@/lib/utils';
import { Send, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useAuth } from '@/lib/clientStore';
import LoginPrompt from '@/components/LoginPrompt';

const authHeader = (): Record<string, string> => {
  try {
    const t = typeof window !== 'undefined' ? localStorage.getItem('dc-agentpay-x-token') : null;
    return t ? { Authorization: `Bearer ${t}` } : {};
  } catch { return {}; }
};

export default function PaymentsPage() {
  const { locale } = useParams<{ locale: string }>();
  const dict = getDict(locale);
  const { isAuthenticated } = useAuth();
  const [agents, setAgents] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ agentId: '', to: '', token: 'USDT', amount: 10, memo: 'API call', aiAssist: true });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const headers = authHeader();
      const [aRes, pRes] = await Promise.all([
        fetch('/api/agents', { headers }),
        fetch('/api/payments', { headers }),
      ]);
      if (aRes.ok) {
        const aData = (await aRes.json()).data || [];
        setAgents(aData);
        if (aData[0] && !form.agentId) setForm(f => ({ ...f, agentId: aData[0]._id || aData[0].id }));
      }
      if (pRes.ok) setPayments((await pRes.json()).data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { if (isAuthenticated) load(); else setLoading(false); }, [isAuthenticated]);

  const submit = async () => {
    setResult(null);
    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify(form),
    });
    const d = await res.json();
    setResult(d);
    load();
  };

  if (!isAuthenticated) return <LoginPrompt locale={locale} dict={dict} title={dict.payments.title} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{dict.payments.title}</h1>
        <button className="btn-primary" onClick={() => setOpen(true)}>
          <Send size={16} /> {dict.payments.newPayment}
        </button>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold mb-3">{dict.payments.history}</h3>
        {loading ? <div className="grid place-items-center py-10"><Loader2 className="animate-spin" size={24} color="#8B5CF6"/></div> :
        payments.length === 0 ? (
          <div className="text-white/50 py-8 text-center">{dict.payments.noData}</div>
        ) : (
          <table className="table">
            <thead><tr><th>Agent</th><th>{dict.payments.toAddress}</th><th>{dict.common.amount}</th><th>{dict.common.token}</th><th>{dict.common.status}</th><th>Tx</th><th>Time</th></tr></thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p._id || p.id}>
                  <td>{p.agentName}</td>
                  <td className="font-mono text-xs">{shortAddr(p.to)}</td>
                  <td>{fmt(p.amount)}</td>
                  <td>{p.token}</td>
                  <td>
                    {p.status === 'success' && <span className="badge-success inline-flex items-center gap-1"><CheckCircle2 size={12}/> {dict.common.success}</span>}
                    {p.status === 'pending' && <span className="badge-pending inline-flex items-center gap-1"><Clock size={12}/> {dict.common.pending}</span>}
                    {p.status === 'failed' && <span className="badge-failed inline-flex items-center gap-1"><XCircle size={12}/> {dict.common.failed}</span>}
                  </td>
                  <td className="font-mono text-xs text-white/50">{shortAddr(p.txHash || '', 4)}</td>
                  <td className="text-xs text-white/50">{p.createdAt ? new Date(p.createdAt).toLocaleString() : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm grid place-items-center z-50 p-4">
          <div className="card p-6 w-full max-w-lg">
            <h3 className="text-xl font-bold mb-4">{dict.payments.newPayment}</h3>
            <div className="space-y-3">
              <div>
                <label className="label">Agent</label>
                <select className="input" value={form.agentId} onChange={(e) => setForm({ ...form, agentId: e.target.value })}>
                  {agents.map((a) => <option key={a._id || a.id} value={a._id || a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">{dict.payments.toAddress}</label>
                <input className="input font-mono text-xs" placeholder="0x..." value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })}/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">{dict.common.token}</label>
                  <select className="input" value={form.token} onChange={(e) => setForm({ ...form, token: e.target.value })}>
                    <option>USDT</option><option>HTX</option><option>KITE</option><option>ETH</option>
                  </select>
                </div>
                <div>
                  <label className="label">{dict.common.amount}</label>
                  <input className="input" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}/>
                </div>
              </div>
              <div>
                <label className="label">{dict.payments.memo}</label>
                <input className="input" value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })}/>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.aiAssist} onChange={(e) => setForm({ ...form, aiAssist: e.target.checked })}/>
                {dict.strategy.aiAssist}
              </label>

              {result && (
                <div className={`p-3 rounded-lg text-xs ${result.ok ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'}`}>
                  {result.ok ? `✅ ${dict.common.success}` : `❌ ${result.error}`}
                  {result.data?.aiDecision && (
                    <pre className="mt-2 whitespace-pre-wrap text-white/60">{JSON.stringify(result.data.aiDecision, null, 2)}</pre>
                  )}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button className="btn-ghost" onClick={() => { setOpen(false); setResult(null); }}>{dict.common.cancel}</button>
              <button className="btn-primary" onClick={submit}>{dict.common.confirm}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
