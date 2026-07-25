'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/setlist');
  }, [router]);

  return (
    <div style={{ backgroundColor: '#0d1310', color: '#2ecc71', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif' }}>
      טוען סטליסט...
    </div>
  );
}