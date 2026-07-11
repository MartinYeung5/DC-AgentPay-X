'use client';
import LoginModal from './LoginModal';
import { useUi } from '@/lib/clientStore';

/** Mounted once in ShellLayout — any component can trigger openLogin() from zustand. */
export default function GlobalLoginModal({ dict }: { dict: any }) {
  const { loginOpen, loginRedirect, closeLogin } = useUi();
  return <LoginModal open={loginOpen} onClose={closeLogin} dict={dict} redirectTo={loginRedirect} />;
}
