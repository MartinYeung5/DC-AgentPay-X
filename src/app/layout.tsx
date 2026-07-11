import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DC AgentPay X — AI Agent Smart Payment Platform',
  description: 'Let every AI Agent become an independent economic actor — built on HTX.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  );
}
