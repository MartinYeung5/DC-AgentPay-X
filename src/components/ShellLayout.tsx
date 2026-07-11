'use client';
import { usePathname, useParams } from 'next/navigation';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import GlobalLoginModal from './GlobalLoginModal';

interface Props {
  locale: string;
  dict: any;
  children: React.ReactNode;
}

export default function ShellLayout({ locale, dict, children }: Props) {
  const pathname = usePathname() || '';

  // Full-screen pages (no sidebar / no topbar)
  const isLoginPage = pathname.endsWith('/login');

  // Landing page (root `/[locale]`) → hide sidebar for a clean marketing look,
  // but keep topbar (with language switcher & login button)
  const isLandingPage =
    pathname === `/${locale}` || pathname === `/${locale}/`;

  if (isLoginPage) {
    return (
      <>
        {children}
        <GlobalLoginModal dict={dict} />
      </>
    );
  }

  if (isLandingPage) {
    return (
      <div className="min-h-screen flex flex-col">
        <Topbar locale={locale} dict={dict} />
        <main className="flex-1 px-4 md:px-8">{children}</main>
        <GlobalLoginModal dict={dict} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar locale={locale} dict={dict} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar locale={locale} dict={dict} />
        <main className="flex-1 p-6">{children}</main>
      </div>
      <GlobalLoginModal dict={dict} />
    </div>
  );
}
