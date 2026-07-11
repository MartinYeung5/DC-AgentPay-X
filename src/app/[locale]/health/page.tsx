'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { getDict } from '@/i18n';
import { Activity, CheckCircle2, XCircle, Loader2, ShieldCheck, Database, Globe, Bot, RefreshCw, Key } from 'lucide-react';
import { useAuth } from '@/lib/clientStore';
import LoginPrompt from '@/components/LoginPrompt';

const icons: Record<string, any> = {
  'MetaMask Auth': ShieldCheck,
  'Google OAuth': Activity,
  'MongoDB': Database,
  'HTX Market API': Globe,
  'HTX Signature': Key,
  'DeepSeek AI': Bot,
  'JWT Session': Activity,
};

export default function HealthPage() {
  const { locale } = useParams<{ locale: string }>();
  const dict = getDict(locale);
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true); setData(null);
    try {
      const d = await fetch('/api/health').then(r => r.json());
      setData(d);
    } finally { setLoading(false); }
  };

  if (!isAuthenticated) return <LoginPrompt locale={locale} dict={dict} title={dict.health.title} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Activity className="text-brand-300"/>{dict.health.title}</h1>
        <p className="text-white/60 mt-1">{dict.health.subtitle}</p>
      </div>

      <button className="btn-primary" onClick={run} disabled={loading}>
        {loading ? <Loader2 className="animate-spin" size={16}/> : <RefreshCw size={16}/>}
        {loading ? dict.common.loading : dict.health.runAll}
      </button>

      {data && (
        <div className="card p-5">
          <div className="mb-3 text-sm text-white/60 flex items-center gap-3">
            <span>{data.timestamp ? new Date(data.timestamp).toLocaleString() : "-"}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${data.mode === 'demo' ? 'bg-amber-500/15 text-amber-300' : 'bg-emerald-500/15 text-emerald-300'}`}>
              {data.mode} mode
            </span>
            {data.ok ? <span className="text-emerald-300 ml-auto">All systems operational ✅</span>
                     : <span className="text-rose-300 ml-auto">Some checks failed ⚠️</span>}
          </div>
          <table className="table">
            <thead><tr><th>{dict.health.module}</th><th>{dict.health.result}</th><th>{dict.health.detail}</th></tr></thead>
            <tbody>
              {data.checks.map((c: any, i: number) => {
                const Icon = icons[c.module] || Activity;
                return (
                  <tr key={i}>
                    <td className="font-medium flex items-center gap-2">
                      <Icon size={16} className="text-brand-300"/>
                      {c.module}
                    </td>
                    <td>
                      {c.ok
                        ? <span className="text-emerald-300 inline-flex items-center gap-1"><CheckCircle2 size={14}/> OK</span>
                        : <span className="text-rose-300 inline-flex items-center gap-1"><XCircle size={14}/> FAIL</span>}
                      {c.demo && <span className="badge-info ml-2">demo</span>}
                    </td>
                    <td className="text-xs text-white/60 font-mono">{c.detail}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
