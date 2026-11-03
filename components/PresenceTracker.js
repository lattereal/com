'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function PresenceTracker() {
  const pathname = usePathname();
  useEffect(() => {
    let stopped = false;
    const send = () => {
      if (stopped || document.visibilityState !== 'visible') return;
      fetch('/api/presence', { method: 'POST', headers: { 'x-current-path': pathname }, cache: 'no-store', keepalive: true }).catch(() => {});
    };
    send();
    const timer = setInterval(send, 45000);
    document.addEventListener('visibilitychange', send);
    return () => { stopped = true; clearInterval(timer); document.removeEventListener('visibilitychange', send); };
  }, [pathname]);
  return null;
}
