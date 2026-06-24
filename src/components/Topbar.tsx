'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { Globe } from 'lucide-react';

const locales = [
  { code: 'zh-TW', label: '繁體中文' },
  { code: 'zh-CN', label: '简体中文' },
  { code: 'en', label: 'English' },
];

export default function Topbar({ locale, dict }: { locale: string; dict: any }) {
  const router = useRouter();
  const pathname = usePathname() || '/';

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = e.target.value;
    const parts = pathname.split('/');
    parts[1] = newLocale;
    router.push(parts.join('/'));
  };

  const demo = useMemo(() => true, []);
  return (
    <header className="h-14 border-b border-white/5 bg-ink-900/60 px-4 flex items-center justify-between">
      <div className="text-sm text-white/60">{dict.common.tagline}</div>
      <div className="flex items-center gap-3">
        {demo && <span className="badge-info badge">{dict.common.demoMode}</span>}
        <div className="flex items-center gap-2 text-sm">
          <Globe size={16} className="text-white/60" />
          <select value={locale} onChange={onChange}
            className="bg-ink-800 border border-white/10 rounded-md px-2 py-1 text-xs">
            {locales.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
        </div>
      </div>
    </header>
  );
}
