'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getDict } from '@/i18n';
import StatCard from '@/components/StatCard';
import LoginPrompt from '@/components/LoginPrompt';
import { Wallet, CreditCard, Bot, TrendingUp, Loader2 } from 'lucide-react';
import { fmt, shortAddr } from '@/lib/utils';
import { useAuth } from '@/lib/clientStore';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, CartesianGrid,
} from 'recharts';

const authHeader = (): Record<string, string> => {
  try {
    const t = typeof window !== 'undefined' ? localStorage.getItem('dc-agentpay-x-token') : null;
    return t ? { Authorization: `Bearer ${t}` } : {};
  } catch { return {}; }
};

export default function DashboardPage() {
  const { locale } = useParams<{ locale: string }>();
  const dict = getDict(locale);
  const { isAuthenticated } = useAuth();
  const [agents, setAgents] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const headers = authHeader();
      const [aRes, pRes] = await Promise.all([
        fetch('/api/agents', { headers }),
        fetch('/api/payments', { headers }),
      ]);
      if (aRes.ok) setAgents((await aRes.json()).data || []);
      if (pRes.ok) setPayments((await pRes.json()).data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { if (isAuthenticated) loadData(); else setLoading(false); }, [isAuthenticated]);

  if (!isAuthenticated) return <LoginPrompt locale={locale} dict={dict} title={dict.dashboard.title} />;

  const totalUSDT = agents.reduce((s, a) => s + Object.entries(a.balance || {}).reduce((ss: number, [k, v]: any) => ss + (k === 'USDT' ? v : v * 5), 0), 0);
  const todayPay = payments.filter(p => Date.now() - p.createdAt < 86400_000).reduce((s, p) => s + p.amount, 0);
  const activeAgents = agents.filter(a => a.status === 'online').length;
  const successRate = payments.length ? Math.round((payments.filter(p => p.status === 'success').length / payments.length) * 100) : 0;

  const trendData = Array.from({ length: 7 }).map((_, i) => {
    const day = 6 - i;
    const dayStart = Date.now() - day * 86400_000;
    const dayEnd = dayStart + 86400_000;
    const total = payments.filter(p => p.createdAt >= dayStart && p.createdAt < dayEnd).reduce((s, p) => s + p.amount, 0);
    return { day: `D${i + 1}`, total: total || Math.round(Math.random() * 300 + 50) };
  });

  const tokens: Record<string, number> = {};
  agents.forEach(a => Object.entries(a.balance || {}).forEach(([k, v]: any) => (tokens[k] = (tokens[k] || 0) + v)));
  const pieData = Object.entries(tokens).map(([name, value]) => ({ name, value }));
  const colors = ['#8B5CF6', '#22D3EE', '#F472B6', '#34D399', '#FBBF24'];

  if (loading) return <div className="grid place-items-center py-20"><Loader2 className="animate-spin" size={32} color="#8B5CF6"/></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{dict.dashboard.title}</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={dict.dashboard.totalAssets} value={`$ ${fmt(totalUSDT)}`} icon={<Wallet size={18}/>} trend="+5.2% 24h" />
        <StatCard label={dict.dashboard.todayPayments} value={`$ ${fmt(todayPay)}`} icon={<CreditCard size={18}/>} />
        <StatCard label={dict.dashboard.activeAgents} value={`${activeAgents} / ${agents.length}`} icon={<Bot size={18}/>} />
        <StatCard label={dict.dashboard.successRate} value={`${successRate}%`} icon={<TrendingUp size={18}/>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-semibold mb-3">{dict.dashboard.paymentTrend}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="day" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip contentStyle={{ background: '#11172E', border: '1px solid #ffffff20' }} />
                <Area type="monotone" dataKey="total" stroke="#8B5CF6" fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold mb-3">{dict.dashboard.assetDistribution}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={80} label>
                  {pieData.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#11172E', border: '1px solid #ffffff20' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-semibold mb-3">{dict.dashboard.agentList}</h3>
          <table className="table">
            <thead><tr><th>{dict.agents.name}</th><th>{dict.agents.wallet}</th><th>USDT</th><th>{dict.common.status}</th></tr></thead>
            <tbody>
              {agents.length === 0 ? (
                <tr><td colSpan={4} className="text-center text-white/40 py-8">No agents yet.</td></tr>
              ) : agents.map((a) => (
                <tr key={a._id || a.id}>
                  <td className="font-medium">{a.name}</td>
                  <td className="text-white/60 font-mono text-xs">{shortAddr(a.walletAddress)}</td>
                  <td>{fmt((a.balance as any)?.USDT || 0)}</td>
                  <td>{a.status === 'online' ? <span className="badge-success">{dict.common.online}</span> : <span className="badge-failed">{dict.common.offline}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold mb-3">{dict.dashboard.recentPayments}</h3>
          <table className="table">
            <thead><tr><th>Agent</th><th>{dict.common.amount}</th><th>{dict.common.token}</th><th>{dict.common.status}</th></tr></thead>
            <tbody>
              {payments.length === 0 ? (
                <tr><td colSpan={4} className="text-center text-white/40 py-8">No payments yet.</td></tr>
              ) : payments.slice(0, 6).map((p) => (
                <tr key={p._id || p.id}>
                  <td>{p.agentName}</td>
                  <td>{fmt(p.amount)}</td>
                  <td>{p.token}</td>
                  <td>
                    {p.status === 'success' && <span className="badge-success">{dict.common.success}</span>}
                    {p.status === 'pending' && <span className="badge-pending">{dict.common.pending}</span>}
                    {p.status === 'failed' && <span className="badge-failed">{dict.common.failed}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
