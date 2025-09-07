// web/src/app/api/reviews/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// 최근 20개 조회
export async function GET() {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reviews: data }, {
    status: 200,
    headers: { 'Cache-Control': 'no-store' }, // 항상 최신
  });
}

// 등록(간단 검증 + 최근 7초 중복 방지)
export async function POST(req: Request) {
  try {
    const { author, product, rating, content } = await req.json();

    if (!author || !product || !content || rating == null) {
      return NextResponse.json({ error: '모든 필드를 입력하세요.' }, { status: 400 });
    }

    const rate = Number(rating);
    if (!Number.isFinite(rate) || rate < 1 || rate > 5) {
      return NextResponse.json({ error: 'rating은 1~5 사이여야 합니다.' }, { status: 400 });
    }

    // 최근 7초 내 동일한 리뷰가 있으면 중복으로 간주
    const recentSince = new Date(Date.now() - 7_000).toISOString();
    const { data: dup, error: selErr } = await supabase
      .from('reviews')
      .select('id')
      .eq('author', author)
      .eq('product', product)
      .eq('content', content)
      .gte('created_at', recentSince)
      .limit(1);

    if (!selErr && dup && dup.length > 0) {
      // 중복이지만 클라이언트 UX를 위해 성공처럼 응답
      return NextResponse.json({ ok: true, duplicate: true }, { status: 201 });
    }

    const { data, error } = await supabase
      .from('reviews')
      .insert({ author, product, rating: rate, content })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, review: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: '잘못된 요청 본문(JSON)' }, { status: 400 });
  }
}
