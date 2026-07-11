'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { getDict } from '@/i18n';
import { Sparkles, Plus, Loader2 } from 'lucide-react';
import { mockAddress } from '@/lib/utils';
import { useAuth } from '@/lib/clientStore';
import LoginPrompt from '@/components/LoginPrompt';

export default function StrategyPage() {
  const { locale } = useParams<{ locale: string }>();
  const dict = getDict(locale);
  const { isAuthenticated } = useAuth();
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [blacklist, setBlacklist] = useState<string[]>([]);
  const [threshold, setThreshold] = useState(200);
  const [aiAssist, setAiAssist] = useState(true);
  const [rules, setRules] = useState<{ token: string; max: number; freq: string }[]>([
    { token: 'USDT', max: 50, freq: 'per-tx' },
    { token: 'HTX', max: 200, freq: 'daily' },
  ]);
  const [aiText, setAiText] = useState('');
  const [loading, setLoading] = useState(false);

  const askAi = async () => {
    setLoading(true); setAiText('');
    try {
      const d = await fetch('/api/deepseek', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `For an AI Agent that performs daily API subscriptions and data purchases, suggest payment limits, slippage and approval thresholds. Locale=${locale}.`,
          max_tokens: 400,
        }),
      }).then(r => r.json());
      setAiText(d.content || d.error || '');
    } finally { setLoading(false); }
  };

  if (!isAuthenticated) return <LoginPrompt locale={locale} dict={dict} title={dict.strategy.title} />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{dict.strategy.title}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-6 space-y-4">
          <h3 className="font-semibold">{dict.strategy.rules}</h3>
          {rules.map((r, i) => (
            <div key={i} className="grid grid-cols-3 gap-2">
              <input className="input" value={r.token}
                onChange={(e) => { const c = [...rules]; c[i].token = e.target.value; setRules(c); }}/>
              <input className="input" type="number" value={r.max}
                onChange={(e) => { const c = [...rules]; c[i].max = Number(e.target.value); setRules(c); }}/>
              <select className="input" value={r.freq}
                onChange={(e) => { const c = [...rules]; c[i].freq = e.target.value; setRules(c); }}>
                <option value="per-tx">per-tx</option>
                <option value="daily">daily</option>
                <option value="weekly">weekly</option>
              </select>
            </div>
          ))}
          <button className="btn-ghost" onClick={() => setRules([...rules, { token: 'USDT', max: 10, freq: 'per-tx' }])}>
            <Plus size={16}/> {dict.strategy.addRule}
          </button>

          <div>
            <label className="label">{dict.strategy.approvalThreshold} (USDT)</label>
            <input className="input" type="number" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))}/>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={aiAssist} onChange={(e) => setAiAssist(e.target.checked)}/>
            {dict.strategy.aiAssist}
          </label>

          <button className="btn-primary">{dict.common.save}</button>
        </div>

        <div className="space-y-4">
          <div className="card p-6">
            <h3 className="font-semibold mb-3">{dict.strategy.whitelist}</h3>
            {whitelist.length === 0 && <div className="text-xs text-white/40 mb-2">—</div>}
            {whitelist.map((w, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <input className="input font-mono text-xs" value={w}
                  onChange={(e) => { const c = [...whitelist]; c[i] = e.target.value; setWhitelist(c); }}/>
                <button className="btn-ghost text-xs" onClick={() => setWhitelist(whitelist.filter((_, idx) => idx !== i))}>×</button>
              </div>
            ))}
            <button className="btn-ghost text-sm" onClick={() => setWhitelist([...whitelist, mockAddress()])}>
              <Plus size={14}/> Add
            </button>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold mb-3">{dict.strategy.blacklist}</h3>
            {blacklist.length === 0 && <div className="text-xs text-white/40 mb-2">—</div>}
            {blacklist.map((w, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <input className="input font-mono text-xs" value={w}
                  onChange={(e) => { const c = [...blacklist]; c[i] = e.target.value; setBlacklist(c); }}/>
                <button className="btn-ghost text-xs" onClick={() => setBlacklist(blacklist.filter((_, idx) => idx !== i))}>×</button>
              </div>
            ))}
            <button className="btn-ghost text-sm" onClick={() => setBlacklist([...blacklist, mockAddress()])}>
              <Plus size={14}/> Add
            </button>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Sparkles size={16} className="text-brand-300" /> AI Advisor (DeepSeek)
              </h3>
              <button className="btn-outline text-sm" onClick={askAi} disabled={loading}>
                {loading ? <Loader2 className="animate-spin" size={14}/> : null}
                {loading ? dict.common.loading : dict.strategy.askAi}
              </button>
            </div>
            {aiText && (
              <pre className="text-xs whitespace-pre-wrap text-white/70 bg-ink-900/60 p-3 rounded-lg max-h-64 overflow-auto">{aiText}</pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
