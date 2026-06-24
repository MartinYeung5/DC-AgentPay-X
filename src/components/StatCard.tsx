import { ReactNode } from 'react';
export default function StatCard({ label, value, icon, trend }: { label: string; value: ReactNode; icon?: ReactNode; trend?: string }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-white/60">{label}</span>
        {icon && <div className="text-brand-300">{icon}</div>}
      </div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
      {trend && <div className="mt-1 text-xs text-emerald-300">{trend}</div>}
    </div>
  );
}
