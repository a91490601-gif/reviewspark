// src/app/api/reviews/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '../../../lib/supabaseClient'; // 경로 유지

// 입력 스키마(서버 측 검증)
const ReviewSchema = z.object({
  author: z.string().min(1).max(30),
  product: z.string().min(1).max(50),
  rating: z.number().int().min(1).max(5),
  content: z.string().min(3).max(500),
});

export async function GET() {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ reviews: data ?? [] });
}

export async function POST(req: Request) {
  // 1) JSON 파싱 + 검증
  const body = await req.json().catch(() => null);
  const parsed = ReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: '잘못된 입력값', details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;

  // 2) 스팸 방지: 같은 author+product 가 5분 내에 한번이라도 올렸으면 차단
  const since = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { data: dup, error: dupErr } = await supabase
    .from('reviews')
    .select('id')
    .eq('author', data.author)
    .eq('product', data.product)
    .gte('created_at', since)
    .limit(1);

  if (dupErr) {
    return NextResponse.json({ error: dupErr.message }, { status: 500 });
  }
  if (dup && dup.length > 0) {
    return NextResponse.json(
      { error: '같은 상품에 대한 리뷰는 잠시 후 다시 시도해주세요.' },
      { status: 429 }
    );
  }

  // 3) 저장
  const { data: inserted, error } = await supabase
    .from('reviews')
    .insert(data)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ review: inserted }, { status: 201 });
}
