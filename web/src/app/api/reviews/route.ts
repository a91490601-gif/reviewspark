// web/src/app/api/reviews/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseClient'

// GET /api/reviews?q=...&sort=...&page=1&limit=10
export async function GET(req: Request) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(req.url)

    const q = (searchParams.get('q') || '').trim()
    const sort = (searchParams.get('sort') || 'newest') as
      | 'newest'
      | 'oldest'
      | 'rating_desc'
      | 'rating_asc'

    const page = Math.max(1, Number(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || '10')))
    const from = (page - 1) * limit
    const to = from + limit - 1

    // ------ 공통 베이스 쿼리 (필터 동일하게 두 번 써야 하므로 함수화)
    const baseFilter = (qb: ReturnType<typeof supabase.from<'reviews'>>) => {
      let query = qb.select('*', { count: 'exact' })
      if (q) {
        // product/author/content 중 하나라도 매칭
        query = query.or(
          `product.ilike.%${q}%,author.ilike.%${q}%,content.ilike.%${q}%`
        )
      }
      // 정렬
      if (sort === 'newest') query = query.order('created_at', { ascending: false })
      if (sort === 'oldest') query = query.order('created_at', { ascending: true })
      if (sort === 'rating_desc') query = query.order('rating', { ascending: false }).order('created_at', { ascending: false })
      if (sort === 'rating_asc') query = query.order('rating', { ascending: true }).order('created_at', { ascending: false })

      return query
    }

    // 총 개수(필터 동일)만 우선 얻기
    const { count: total, error: countErr } = await baseFilter(
      supabase.from('reviews')
    ).range(0, 0) // 데이터는 버리고 count만 받음
    if (countErr) throw countErr

    // 실제 페이지 데이터
    const { data, error } = await baseFilter(supabase.from('reviews')).range(from, to)
    if (error) throw error

    const hasMore = total ? to + 1 < total : false

    return NextResponse.json({
      reviews: data ?? [],
      page,
      limit,
      total: total ?? 0,
      hasMore,
    })
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST /api/reviews
export async function POST(req: Request) {
  try {
    const supabase = createClient()
    const body = await req.json()

    const author = String(body.author || '').trim()
    const product = String(body.product || '').trim()
    const content = String(body.content || '').trim()
    const rating = Number(body.rating)

    if (!author || !product || !content) {
      return NextResponse.json({ error: '모든 필드를 입력하세요.' }, { status: 400 })
    }
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: '평점은 1~5 사이여야 합니다.' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('reviews')
      .insert({ author, product, content, rating })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ review: data })
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
