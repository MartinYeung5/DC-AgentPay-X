'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Bot, CreditCard, Shuffle, Settings2, Plug, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  locale: string;
  dict: any;
}

const items = (dict: any) => [
  { href: 'dashboard', label: dict.nav.dashboard, icon: LayoutDashboard },
  { href: 'agents', label: dict.nav.agents, icon: Bot },
  { href: 'payments', label: dict.nav.payments, icon: CreditCard },
  { href: 'swap', label: dict.nav.swap, icon: Shuffle },
  { href: 'strategy', label: dict.nav.strategy, icon: Settings2 },
  { href: 'gateway', label: dict.nav.gateway, icon: Plug },
  { href: 'health', label: dict.nav.health, icon: Activity },
];

export default function Sidebar({ locale, dict }: Props) {
  const pathname = usePathname();
  return (
    <aside className="w-60 shrink-0 border-r border-white/5 bg-ink-900/60 min-h-screen p-4 hidden md:block">
      <Link href={`/${locale}`} className="flex items-center gap-2 mb-8">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-fuchsia-500 grid place-items-center font-bold">A</div>
        <span className="text-lg font-bold">{dict.common.appName}</span>
      </Link>
      <nav className="space-y-1">
        {items(dict).map((it) => {
          const href = `/${locale}/${it.href}`;
          const active = pathname?.startsWith(href);
          const Icon = it.icon;
          return (
            <Link key={it.href} href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                active ? 'bg-brand-600/20 text-brand-200' : 'text-white/70 hover:bg-white/5 hover:text-white'
              )}>
              <Icon size={18} />
              {it.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
