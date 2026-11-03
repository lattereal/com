'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfileLiveRefresh() {
  const router = useRouter();
  useEffect(() => {
    const timer = setInterval(() => {
      if (!document.hidden) router.refresh();
    }, 60000);
    return () => clearInterval(timer);
  }, [router]);
  return null;
}
