// src/app/api/reviews/route.ts
import { NextResponse } from 'next/server';
// route.ts → reviews → api → app → src 로 3단계 올라가서 lib 로 이동
import { supabase } from '../../../lib/supabaseClient';

export async function GET() {
  // 최근 20개 리뷰를 시간 내림차순으로 반환 (브라우저에서 /api/reviews 방문해 테스트 가능)
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ reviews: data ?? [] });
}

export async function POST(req: Request) {
  try {
    const { author, product, rating, content } = await req.json();

    // 간단한 유효성 검사
    if (!author || !product || !rating || !content) {
      return NextResponse.json({ error: '모든 항목을 입력하세요.' }, { status: 400 });
    }
    const num = Number(rating);
    if (Number.isNaN(num) || num < 1 || num > 5) {
      return NextResponse.json({ error: '평점은 1~5 사이여야 합니다.' }, { status: 400 });
    }

    const { error } = await supabase.from('reviews').insert([
      { author, product, rating: num, content }
    ]);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'unknown error' }, { status: 500 });
  }
}
