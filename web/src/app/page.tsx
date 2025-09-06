// src/app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(() => setReady(true))
      .catch(() => setReady(false));
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <h1>ReviewSpark</h1>
      <p>{ready ? '✅ Supabase client 연결 OK' : '⏳ 연결 확인 중...'}</p>
    </main>
  );
}
