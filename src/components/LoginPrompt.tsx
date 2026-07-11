'use client';
import { usePathname } from 'next/navigation';
import { ShieldCheck, LogIn } from 'lucide-react';
import { useUi } from '@/lib/clientStore';

interface Props {
  locale: string;
  dict: any;
  title?: string;
}

/** Shown on guarded pages — clicking Login opens the global modal (no page navigation). */
export default function LoginPrompt({ locale, dict, title }: Props) {
  const pathname = usePathname();
  const { openLogin } = useUi();

  return (
    <div className="min-h-[calc(100vh-6rem)] grid place-items-center">
      <div className="card p-10 max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-fuchsia-500 mb-4">
          <ShieldCheck size={30} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          {title || dict.auth.title}
        </h2>
        <p className="text-white/60 text-sm mb-6">
          {dict.auth.subtitle}
        </p>
        <button
          className="btn-primary w-full py-3"
          onClick={() => openLogin(pathname || `/${locale}/dashboard`)}
        >
          <LogIn size={16} /> {dict.common.login}
        </button>
        <div className="mt-6 pt-6 border-t border-white/5 text-xs text-white/40">
          MetaMask · Google · Powered by HTX
        </div>
      </div>
    </div>
  );
}
