import { getDict, locales } from '@/i18n';
import { notFound } from 'next/navigation';
import ShellLayout from '@/components/ShellLayout';

export function generateStaticParams() {
  return locales.map((l) => ({ locale: l }));
}

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;
  if (!(locales as readonly string[]).includes(locale)) notFound();
  const dict = getDict(locale);
  return <ShellLayout locale={locale} dict={dict}>{children}</ShellLayout>;
}
