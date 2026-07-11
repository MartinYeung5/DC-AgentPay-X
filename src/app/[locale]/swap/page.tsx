'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getDict } from '@/i18n';
import { fmt } from '@/lib/utils';
import { ArrowDown, RefreshCw, Loader2, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { useAuth } from '@/lib/clientStore';
import LoginPrompt from '@/components/LoginPrompt';

const TOKENS = ['USDT', 'HTX', 'KITE', 'ETH', 'BTC', 'TRX'];

const authHeader = (): Record<string, string> => {
  try {
    const t = typeof window !== 'undefined' ? localStorage.getItem('dc-agentpay-x-token') : null;
    return t ? { Authorization: `Bearer ${t}` } : {};
  } catch { return {}; }
};

export default function SwapPage() {
  const { locale } = useParams<{ locale: string }>();
  const dict = getDict(locale);
  const { isAuthenticated } = useAuth();
  const [agents, setAgents] = useState<any[]>([]);
  const [form, setForm] = useState({ agentId: '', from: 'USDT', to: 'HTX', amount: 100, slippage: 0.005 });
  const [quote, setQuote] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetch('/api/agents', { headers: authHeader() }).then(r => r.json()).then(d => {
      const list = d.data || [];
      setAgents(list);
      if (list[0]) setForm(f => ({ ...f, agentId: list[0]._id || list[0].id }));
    });
  }, [isAuthenticated]);

  const getQuote = async () => {
    setRefreshing(true);
    try {
      const url = `/api/swap?from=${form.from}&to=${form.to}&amount=${form.amount}`;
      const d = await fetch(url).then(r => r.json());
      setQuote(d);
    } catch {}
    setRefreshing(false);
  };

  useEffect(() => { if (isAuthenticated) getQuote(); }, [form.from, form.to, form.amount, isAuthenticated]);

  const execute = async () => {
    setResult(null); setLoading(true);
    try {
      const res = await fetch('/api/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!d.ok && d.requiresOverride) {
        if (confirm('Amount exceeds auto-swap limit. Override?')) {
          const res2 = await fetch('/api/swap', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeader() },
            body: JSON.stringify({ ...form, overrideLimit: true }),
          });
          setResult(await res2.json());
        } else {
          setResult({ ok: false, error: 'Override cancelled' });
        }
      } else {
        setResult(d);
      }
    } catch (e: any) {
      setResult({ ok: false, error: e.message });
    }
    setLoading(false);
  };

  if (!isAuthenticated) return <LoginPrompt locale={locale} dict={dict} title={dict.swap.title} />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{dict.swap.title}</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-6 space-y-4">
          <div>
            <label className="label">Agent</label>
            <select className="input" value={form.agentId} onChange={(e) => setForm({ ...form, agentId: e.target.value })}>
              {agents.map((a) => <option key={a._id || a.id} value={a._id || a.id}>{a.name}</option>)}
            </select>
          </div>

          <div className="bg-ink-900/60 rounded-xl p-4 border border-white/5">
            <div className="text-xs text-white/60 mb-2">{dict.swap.from}</div>
            <div className="flex items-center gap-3">
              <input className="input flex-1" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}/>
              <select className="input w-28" value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })}>
                {TOKENS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="flex justify-center">
            <button className="btn-ghost rounded-full p-2" onClick={() => setForm({ ...form, from: form.to, to: form.from })}>
              <ArrowDown size={16} />
            </button>
          </div>

          <div className="bg-ink-900/60 rounded-xl p-4 border border-white/5">
            <div className="text-xs text-white/60 mb-2">{dict.swap.to}</div>
            <div className="flex items-center gap-3">
              <input className="input flex-1" value={quote ? fmt(quote.estimated, 6) : '~'} readOnly/>
              <select className="input w-28" value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })}>
                {TOKENS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label">{dict.swap.slippage} (%)</label>
            <input className="input" type="number" step="0.1" value={(form.slippage * 100).toFixed(1)}
              onChange={(e) => setForm({ ...form, slippage: Number(e.target.value) / 100 })}/>
          </div>

          <div className="flex gap-2">
            <button className="btn-outline flex-1" onClick={getQuote}>
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''}/>{dict.swap.quote}
            </button>
            <button className="btn-primary flex-1" onClick={execute} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" size={16}/> : dict.swap.execute}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {quote && (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{dict.swap.liveRate}</h3>
                <span className="text-xs text-white/50 flex items-center gap-1"><ExternalLink size={12}/>{dict.swap.liveRateFrom}</span>
              </div>
              <div className="text-sm text-white/70 space-y-1">
                <div>1 {quote.from} ≈ {fmt(quote.price, 6)} {quote.to}</div>
                <div>{dict.common.amount}: {fmt(form.amount)} {quote.from}</div>
                <div>{dict.swap.to}: <span className="text-brand-300">{fmt(quote.estimated, 6)} {quote.to}</span></div>
                <div>{dict.swap.slippage}: {(form.slippage * 100).toFixed(2)}%</div>
                <div className="text-xs text-white/40">Updated: {new Date(quote.timestamp || Date.now()).toLocaleTimeString()}</div>
              </div>
            </div>
          )}

          {result && (
            <div className={`card p-5 ${result.ok ? 'border-emerald-500/30' : 'border-rose-500/30'}`}>
              {result.ok ? (
                <>
                  <h3 className="font-semibold text-emerald-300 mb-2 inline-flex items-center gap-1"><CheckCircle2 size={16}/> {dict.swap.swapSuccess}</h3>
                  <div className="text-sm text-white/70 space-y-1">
                    <div>{dict.swap.from}: {fmt(result.data.fromAmount)} {result.data.fromToken}</div>
                    <div>{dict.swap.to}: {fmt(result.data.toAmount, 6)} {result.data.toToken}</div>
                    <div>{dict.swap.estPrice}: {fmt(result.data.price, 6)}</div>
                    <div className="text-xs text-white/50">Fee: {fmt(result.data.fee, 4)}</div>
                  </div>
                </>
              ) : (
                <div className="text-rose-300 inline-flex items-center gap-1"><XCircle size={16}/> {result.error}</div>
              )}
            </div>
          )}

          <div className="card p-5">
            <h3 className="font-semibold mb-2">HTX Smart Routing</h3>
            <p className="text-sm text-white/60">{dict.landing.feature3Desc}</p>
            <div className="mt-3 text-xs text-white/40">
              Realtime rates fetched directly from HTX Chain market data.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
