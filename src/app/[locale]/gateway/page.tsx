'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getDict } from '@/i18n';
import { shortAddr } from '@/lib/utils';
import { Plus, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/clientStore';
import LoginPrompt from '@/components/LoginPrompt';

const authHeader = (): Record<string, string> => {
  try {
    const t = typeof window !== 'undefined' ? localStorage.getItem('dc-agentpay-x-token') : null;
    return t ? { Authorization: `Bearer ${t}` } : {};
  } catch { return {}; }
};

export default function GatewayPage() {
  const { locale } = useParams<{ locale: string }>();
  const dict = getDict(locale);
  const { isAuthenticated } = useAuth();
  const [list, setList] = useState<any[]>([]);
  const [form, setForm] = useState({ serviceId: 'svc_kite_api', amount: 5, token: 'USDT', callbackUrl: 'https://example.com/webhook' });
  const [last, setLast] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const res = await fetch('/api/gateway', { headers: authHeader() });
    if (res.ok) setList((await res.json()).data || []);
  };

  useEffect(() => { if (isAuthenticated) load(); }, [isAuthenticated]);

  const create = async () => {
    setLoading(true);
    const res = await fetch('/api/gateway', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify(form),
    });
    const d = await res.json();
    setLast(d.data);
    load();
    setLoading(false);
  };

  if (!isAuthenticated) return <LoginPrompt locale={locale} dict={dict} title={dict.gateway.title} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{dict.gateway.title}</h1>
        <p className="text-white/60 mt-1">{dict.gateway.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-6 space-y-3">
          <h3 className="font-semibold">{dict.gateway.createRequest}</h3>
          <div>
            <label className="label">{dict.gateway.serviceId}</label>
            <input className="input" value={form.serviceId} onChange={(e) => setForm({ ...form, serviceId: e.target.value })}/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{dict.common.amount}</label>
              <input className="input" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}/>
            </div>
            <div>
              <label className="label">{dict.common.token}</label>
              <select className="input" value={form.token} onChange={(e) => setForm({ ...form, token: e.target.value })}>
                <option>USDT</option><option>HTX</option><option>KITE</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">{dict.gateway.callbackUrl}</label>
            <input className="input" value={form.callbackUrl} onChange={(e) => setForm({ ...form, callbackUrl: e.target.value })}/>
          </div>
          <button className="btn-primary" onClick={create} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={16}/> : <Plus size={16}/>} {dict.gateway.createRequest}
          </button>

          {last && (
            <div className="bg-emerald-500/10 text-emerald-300 p-3 rounded-lg text-xs">
              ✅ {dict.gateway.requestCreated}
              <pre className="mt-2 whitespace-pre-wrap text-white/70">{JSON.stringify(last, null, 2)}</pre>
            </div>
          )}
        </div>

        <div className="card p-6">
          <h3 className="font-semibold mb-3">{dict.gateway.docs}</h3>
          <pre className="text-xs bg-ink-900/60 p-3 rounded-lg overflow-auto">{`POST /api/gateway
{
  "serviceId": "svc_kite_api",
  "amount": 5,
  "token": "USDT",
  "callbackUrl": "https://your.app/webhook"
}

→ { "ok": true, "data": { "id": "req_xxx", "signature": "<HMAC-SHA256>", "status": "open" } }`}</pre>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold mb-3">Requests</h3>
        <table className="table">
          <thead><tr><th>ID</th><th>{dict.gateway.serviceId}</th><th>{dict.common.amount}</th><th>Sig</th><th>{dict.common.status}</th></tr></thead>
          <tbody>
            {list.length === 0 ? (
              <tr><td colSpan={5} className="text-center text-white/40 py-8">No requests yet</td></tr>
            ) : list.map((r) => (
              <tr key={r._id || r.id}>
                <td className="font-mono text-xs">{r._id || r.id}</td>
                <td>{r.serviceId}</td>
                <td>{r.amount} {r.token}</td>
                <td className="font-mono text-xs text-white/50">{shortAddr(r.signature, 6)}</td>
                <td><span className="badge-info">{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
