'use client';
import { useState } from 'react';
import { X, Link as LinkIcon, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  dict: any;
}

const authMethods = ['bearer', 'basic', 'apikey_header'] as const;
const currencies = ['USDT', 'HTX', 'KITE', 'ETH', 'BTC', 'TRX'] as const;

const authHeader = (): Record<string, string> => {
  try {
    const t = typeof window !== 'undefined' ? localStorage.getItem('dc-agentpay-x-token') : null;
    return t ? { Authorization: `Bearer ${t}` } : {};
  } catch { return {}; }
};

export default function AgentConnectForm({ isOpen, onClose, onSuccess, dict }: Props) {
  const [form, setForm] = useState({
    name: '',
    type: 'general',
    apiEndpoint: '',
    apiKey: '',
    authMethod: 'bearer' as typeof authMethods[number],
    currency: 'USDT',
    autoSwapLimit: 500,
    dailyLimit: 2000,
    perTxLimit: 500,
    permissions: { read: true, trade: true, withdraw: false },
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'ok' | 'fail' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const testConnection = async () => {
    if (!form.apiEndpoint || !form.apiKey) return;
    setTesting(true); setTestResult(null);
    try {
      const res = await fetch('/api/agents/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ endpoint: form.apiEndpoint, apiKey: form.apiKey, authMethod: form.authMethod }),
      });
      const data = await res.json();
      setTestResult(data.ok ? 'ok' : 'fail');
    } catch {
      setTestResult('fail');
    } finally {
      setTesting(false);
    }
  };

  const submit = async () => {
    setSubmitting(true); setMessage('');
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ ...form, isReal: true }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage(dict.agents.createSuccess);
        setTimeout(() => { onClose(); onSuccess(); }, 1200);
      } else {
        setMessage(data.error || 'Failed');
      }
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm grid place-items-center z-50 p-4">
      <div className="card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">{dict.agents.connect}</h3>
          <button className="btn-ghost p-1" onClick={onClose}><X size={18}/></button>
        </div>

        <p className="text-sm text-white/60 mb-4">{dict.agents.instructions}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">{dict.agents.name}</label>
            <input className="input" placeholder={dict.agents.namePlaceholder}
              value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          </div>

          <div>
            <label className="label">{dict.agents.type}</label>
            <input className="input" placeholder={dict.agents.typePlaceholder}
              value={form.type} onChange={e => setForm({...form, type: e.target.value})} />
          </div>

          <div>
            <label className="label">{dict.agents.currency}</label>
            <select className="input" value={form.currency}
              onChange={e => setForm({...form, currency: e.target.value})}>
              {currencies.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div className="col-span-2">
            <label className="label">{dict.agents.apiEndpoint}</label>
            <div className="flex gap-2">
              <input className="input flex-1 font-mono text-xs" placeholder={dict.agents.endpointPlaceholder}
                value={form.apiEndpoint} onChange={e => setForm({...form, apiEndpoint: e.target.value})} />
              <button className="btn-outline" onClick={testConnection} disabled={testing || !form.apiEndpoint || !form.apiKey}>
                {testing ? <Loader2 className="animate-spin" size={16}/> : <LinkIcon size={16}/>}
              </button>
            </div>
            {testResult === 'ok' && (
              <div className="flex items-center gap-1 mt-1 text-xs text-emerald-400">
                <CheckCircle2 size={12}/> {dict.agents.connectionOk}
              </div>
            )}
            {testResult === 'fail' && (
              <div className="flex items-center gap-1 mt-1 text-xs text-rose-400">
                <XCircle size={12}/> {dict.agents.connectionFailed}
              </div>
            )}
          </div>

          <div>
            <label className="label">{dict.agents.apiKey}</label>
            <input className="input font-mono text-xs" type="password" placeholder={dict.agents.apiKeyPlaceholder}
              value={form.apiKey} onChange={e => setForm({...form, apiKey: e.target.value})} />
          </div>

          <div>
            <label className="label">{dict.agents.authMethod}</label>
            <select className="input" value={form.authMethod}
              onChange={e => setForm({...form, authMethod: e.target.value as any})}>
              <option value="bearer">{dict.agents.authBearer}</option>
              <option value="basic">{dict.agents.authBasic}</option>
              <option value="apikey_header">{dict.agents.authApiKey}</option>
            </select>
          </div>

          <div>
            <label className="label">{dict.agents.autoSwapLimit} (USDT)</label>
            <input className="input" type="number" value={form.autoSwapLimit}
              onChange={e => setForm({...form, autoSwapLimit: Number(e.target.value)})} />
          </div>

          <div>
            <label className="label">{dict.agents.dailyLimit} (USDT)</label>
            <input className="input" type="number" value={form.dailyLimit}
              onChange={e => setForm({...form, dailyLimit: Number(e.target.value)})} />
          </div>

          <div>
            <label className="label">{dict.agents.perTxLimit} (USDT)</label>
            <input className="input" type="number" value={form.perTxLimit}
              onChange={e => setForm({...form, perTxLimit: Number(e.target.value)})} />
          </div>

          <div className="col-span-2">
            <label className="label">{dict.agents.permissions}</label>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.permissions.read}
                  onChange={e => setForm({...form, permissions: {...form.permissions, read: e.target.checked}})} />
                {dict.agents.permRead}
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.permissions.trade}
                  onChange={e => setForm({...form, permissions: {...form.permissions, trade: e.target.checked}})} />
                {dict.agents.permTrade}
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.permissions.withdraw}
                  onChange={e => setForm({...form, permissions: {...form.permissions, withdraw: e.target.checked}})} />
                {dict.agents.permWithdraw}
              </label>
            </div>
          </div>
        </div>

        {message && (
          <div className={cn('mt-4 p-3 rounded-lg text-sm',
            message.includes('成功') || message.includes('success') ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'
          )}>{message}</div>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <button className="btn-ghost" onClick={onClose}>{dict.common.cancel}</button>
          <button className="btn-primary" onClick={submit} disabled={submitting || !form.name || !form.apiEndpoint || !form.apiKey}>
            {submitting ? <Loader2 className="animate-spin" size={16}/> : null}
            {submitting ? dict.common.loading : dict.common.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
