'use client';
import { usePathname, useRouter } from 'next/navigation';
import { Globe } from 'lucide-react';
import { useUi, useAuth } from '@/lib/clientStore';
import LoginButton from './LoginButton';
import { cn } from '@/lib/utils';

export default function Topbar({ locale, dict }: { locale: string; dict: any }) {
  const router = useRouter();
  const pathname = usePathname() || '/';
  const { mode, setMode } = useUi();
  const { isAuthenticated } = useAuth();

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = e.target.value;
    const parts = pathname.split('/');
    parts[1] = newLocale;
    router.push(parts.join('/'));
  };

  const toggleMode = () => setMode(mode === 'demo' ? 'production' : 'demo');

  return (
    <header className="h-14 border-b border-white/5 bg-ink-900/60 backdrop-blur px-4 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3 min-w-0">
        {isAuthenticated && (
          <button
            className={cn(
              'text-xs px-2.5 py-1 rounded-md border transition',
              mode === 'demo'
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/15'
                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15'
            )}
            onClick={toggleMode}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current inline-block mr-1.5 align-middle" />
            {mode === 'demo' ? dict.common.demoMode : dict.common.productionMode}
          </button>
        )}
        <span className="text-sm text-white/50 hidden md:inline truncate">{dict.common.tagline}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Globe size={14} className="text-white/40" />
          <select
            value={locale}
            onChange={onChange}
            className="bg-ink-800 border border-white/10 rounded-md px-2 py-1 text-xs text-white/80"
          >
            <option value="zh-TW">繁體中文</option>
            <option value="zh-CN">简体中文</option>
            <option value="en">English</option>
          </select>
        </div>
        <LoginButton dict={dict} size="sm" />
      </div>
    </header>
  );
}
