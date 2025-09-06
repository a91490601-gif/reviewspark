'use client';

import { supabase } from '../lib/supabaseClient';

export default function Home() {
  return (
    <main style={{ padding: 24 }}>
      <h1>ReviewSpark</h1>
      <p>Supabase 연결 준비 완료 ✅</p>
    </main>
  );
}
