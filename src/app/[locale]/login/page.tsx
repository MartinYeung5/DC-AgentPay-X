'use client';
import { useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getDict } from '@/i18n';
import { useAuth, useUi } from '@/lib/clientStore';
import LoginModal from '@/components/LoginModal';
import { ArrowLeft, Globe, ShieldCheck, Wallet, Sparkles, Lock } from 'lucide-react';

export default function LoginPage() {
  const { locale } = useParams<{ locale: string }>();
  const dict = getDict(locale);
  const router = useRouter();
  const search = useSearchParams();
  const { isAuthenticated } = useAuth();
  const { loginOpen, openLogin, closeLogin } = useUi();

  const redirect = search?.get('redirect') || `/${locale}/dashboard`;

  // Auto-open the modal when landing on /login
  useEffect(() => {
    if (isAuthenticated) {
      router.replace(redirect);
    } else if (!loginOpen) {
      openLogin(redirect);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen bg-ink-900 relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-brand-600/20 blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-fuchsia-500/15 blur-3xl" />

      <header className="relative z-10 flex items-center justify-between px-6 py-4">
        <Link href={`/${locale}`} className="flex items-center gap-2 text-white/70 hover:text-white transition">
          <ArrowLeft size={16} />
          <span className="text-sm">Back to home</span>
        </Link>
        <div className="flex items-center gap-2">
          <Globe size={14} className="text-white/40" />
          <select
            value={locale}
            onChange={(e) => router.push(`/${e.target.value}/login`)}
            className="bg-transparent border border-white/10 rounded-md px-2 py-1 text-xs text-white"
          >
            <option value="zh-TW" className="bg-ink-800">繁體中文</option>
            <option value="zh-CN" className="bg-ink-800">简体中文</option>
            <option value="en"    className="bg-ink-800">English</option>
          </select>
        </div>
      </header>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-16 text-center">
        <div className="inline-flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-fuchsia-500 grid place-items-center font-bold text-white">D</div>
          <span className="text-xl font-bold text-white">DC AgentPay X</span>
        </div>

        <h1 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-4">
          {dict.auth.title}
        </h1>
        <p className="text-white/60 text-lg max-w-md mx-auto mb-10">
          {dict.landing.subtitle}
        </p>

        {!loginOpen && (
          <button
            className="btn-primary px-8 py-4 text-base"
            onClick={() => openLogin(redirect)}
          >
            <ShieldCheck size={18} /> {dict.common.login}
          </button>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-16 max-w-3xl mx-auto">
          {[
            { icon: Wallet,   t: dict.landing.feature1Title, d: dict.landing.feature1Desc },
            { icon: Sparkles, t: dict.landing.feature2Title, d: dict.landing.feature2Desc },
            { icon: Lock,     t: dict.landing.feature3Title, d: dict.landing.feature3Desc },
          ].map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="card p-5 text-left">
                <div className="w-9 h-9 rounded-lg bg-brand-600/20 grid place-items-center text-brand-300 mb-3">
                  <Icon size={18} />
                </div>
                <div className="text-white font-medium">{f.t}</div>
                <div className="text-white/50 text-xs mt-1">{f.d}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal is mounted here for /login page (since ShellLayout skips shell) */}
      <LoginModal open={loginOpen} onClose={closeLogin} dict={dict} redirectTo={redirect} />
    </div>
  );
}
