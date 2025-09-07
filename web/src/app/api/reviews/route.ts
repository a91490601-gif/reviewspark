import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// 최근 20개 조회
export async function GET() {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reviews: data }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
}

// 등록 (DB 유니크 인덱스로 중복 차단, 중복이면 성공처럼 응답)
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

    // 바로 insert 시도 → 유니크 위반이면 duplicate로 처리
    const { data, error } = await supabase
      .from('reviews')
      .insert({ author, product, rating: rate, content })
      .select()
      .single();

    if (error) {
      // 유니크 제약(중복)일 때 메시지에 보통 'duplicate key value'가 포함됨
      if (String(error.message).toLowerCase().includes('duplicate')) {
        return NextResponse.json({ ok: true, duplicate: true }, { status: 201 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, review: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: '잘못된 요청 본문(JSON)' }, { status: 400 });
  }
}
