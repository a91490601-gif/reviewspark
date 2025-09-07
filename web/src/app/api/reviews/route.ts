// web/src/app/api/reviews/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// ✅ GET: 페이지네이션(기본 page=1, limit=10)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? '10')));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from('reviews')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const hasMore = typeof count === 'number' ? to + 1 < count : (data?.length ?? 0) === limit;

  return NextResponse.json(
    { reviews: data ?? [], page, limit, hasMore },
    { status: 200, headers: { 'Cache-Control': 'no-store' } }
  );
}

// ✅ POST: 리뷰 등록
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const author = String(body?.author ?? '').trim();
    const product = String(body?.product ?? '').trim();
    const content = String(body?.content ?? '').trim();
    const ratingNum = Number(body?.rating);

    if (!author || !product || !content || Number.isNaN(ratingNum)) {
      return NextResponse.json({ error: '모든 필드를 입력하세요.' }, { status: 400 });
    }
    if (ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json({ error: '평점은 1~5 사이여야 합니다.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('reviews')
      .insert([{ author, product, content, rating: ratingNum }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, review: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }
}
