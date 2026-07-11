'use client';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { getDict } from '@/i18n';
import { Wallet, Cpu, Shuffle, LayoutDashboard, ArrowRight, LogIn } from 'lucide-react';
import { useAuth, useUi } from '@/lib/clientStore';

export default function Landing() {
  const { locale } = useParams<{ locale: string }>();
  const pathname = usePathname();
  const dict = getDict(locale);
  const { isAuthenticated } = useAuth();
  const { openLogin } = useUi();

  const features = [
    { icon: Wallet, title: dict.landing.feature1Title, desc: dict.landing.feature1Desc },
    { icon: Cpu, title: dict.landing.feature2Title, desc: dict.landing.feature2Desc },
    { icon: Shuffle, title: dict.landing.feature3Title, desc: dict.landing.feature3Desc },
    { icon: LayoutDashboard, title: dict.landing.feature4Title, desc: dict.landing.feature4Desc },
  ];

  const handleLogin = () => openLogin(`/${locale}/dashboard`);

  return (
    <div className="relative">
      <div className="glow absolute inset-0 -z-10 h-[600px]" />

      <section className="text-center py-20">
        <span className="badge-info badge mb-4">Powered by HTX × DeepSeek</span>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-brand-300">
          {dict.common.appName}
        </h1>
        <p className="mt-4 text-lg text-white/70 max-w-2xl mx-auto">
          {dict.landing.subtitle}
        </p>

        <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
          {isAuthenticated ? (
            <Link href={`/${locale}/dashboard`} className="btn-primary px-6 py-3 text-base">
              {dict.common.viewDashboard} <ArrowRight size={16} />
            </Link>
          ) : (
            <button className="btn-primary px-6 py-3 text-base" onClick={handleLogin}>
              <LogIn size={16} /> {dict.common.login}
            </button>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <div key={i} className="card p-6">
              <div className="w-10 h-10 rounded-lg bg-brand-600/20 grid place-items-center text-brand-300 mb-3">
                <Icon size={20} />
              </div>
              <h3 className="font-semibold text-lg">{f.title}</h3>
              <p className="mt-2 text-sm text-white/60 leading-relaxed">{f.desc}</p>
            </div>
          );
        })}
      </section>

      <section className="card p-8 mt-10 text-center">
        <h2 className="text-2xl font-bold">{dict.landing.ctaTitle}</h2>
        <p className="mt-2 text-white/60">{dict.landing.ctaDesc}</p>
        {isAuthenticated ? (
          <Link href={`/${locale}/agents`} className="btn-primary mt-5 inline-flex px-6 py-3">
            {dict.common.getStarted} <ArrowRight size={16} />
          </Link>
        ) : (
          <button className="btn-primary mt-5 inline-flex px-6 py-3" onClick={handleLogin}>
            {dict.common.getStarted} <ArrowRight size={16} />
          </button>
        )}
      </section>
    </div>
  );
}
