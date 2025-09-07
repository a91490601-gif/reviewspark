// web/src/app/page.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'

type Review = {
  id: number
  created_at: string
  author: string
  product: string
  rating: number
  content: string
}

type ApiListRes = {
  reviews: Review[]
  page: number
  limit: number
  total: number
  hasMore: boolean
}

export default function Page() {
  // 폼 상태
  const [author, setAuthor] = useState('')
  const [product, setProduct] = useState('')
  const [rating, setRating] = useState<number>(5)
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 리스트 상태
  const [items, setItems] = useState<Review[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)

  // 필터 상태
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<'newest' | 'oldest' | 'rating_desc' | 'rating_asc'>(
    'newest'
  )

  const queryString = useMemo(
    () => new URLSearchParams({ q, sort, page: String(page), limit: '10' }).toString(),
    [q, sort, page]
  )

  // 목록 로드
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const res = await fetch(`/api/reviews?${queryString}`, { cache: 'no-store' })
      const json: ApiListRes = await res.json()
      if (cancelled) return

      // page가 1이면 갈아끼고, 그 외에는 이어붙임
      setItems(prev => (json.page === 1 ? json.reviews : [...prev, ...json.reviews]))
      setHasMore(json.hasMore)
      setTotal(json.total)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [queryString])

  // 필터가 바뀌면 1페이지부터
  const applyFilter = () => {
    setPage(1)
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author, product, rating, content }),
      })

      const json = await res.json()
      if (!res.ok) {
        alert(json?.error || '등록 실패')
        return
      }

      // 폼 리셋
      setAuthor('')
      setProduct('')
      setRating(5)
      setContent('')

      // 새 조건으로 1페이지 다시 로드(최신이 위로 오도록)
      setPage(1)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-4xl font-extrabold mb-8">ReviewSpark</h1>

      {/* 작성 폼 */}
      <form onSubmit={onSubmit} className="rounded-2xl border border-gray-700 p-5 mb-10">
        <div className="grid gap-3">
          <input
            placeholder="작성자"
            className="w-full rounded-xl border border-gray-600 bg-transparent px-4 py-3"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />
          <input
            placeholder="상품명"
            className="w-full rounded-xl border border-gray-600 bg-transparent px-4 py-3"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
          />
          <input
            placeholder="평점(1~5)"
            className="w-full rounded-xl border border-gray-600 bg-transparent px-4 py-3"
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            inputMode="numeric"
          />
          <textarea
            placeholder="리뷰 내용"
            className="min-h-[120px] w-full rounded-xl border border-gray-600 bg-transparent px-4 py-3"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <button
            disabled={isSubmitting}
            className="mt-2 rounded-xl bg-white/90 text-black px-5 py-3 font-semibold disabled:opacity-50"
          >
            {isSubmitting ? '등록 중…' : '리뷰 등록'}
          </button>
        </div>
      </form>

      {/* 필터 */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          placeholder="검색 (작성자/상품/내용)"
          className="flex-1 rounded-xl border border-gray-600 bg-transparent px-4 py-2"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
        />
        <select
          className="rounded-xl border border-gray-600 bg-transparent px-3 py-2"
          value={sort}
          onChange={(e) => setSort(e.target.value as any)}
        >
          <option value="newest">최신순</option>
          <option value="oldest">오래된순</option>
          <option value="rating_desc">별점 높은순</option>
          <option value="rating_asc">별점 낮은순</option>
        </select>
        <button
          className="rounded-xl border border-gray-600 px-4 py-2"
          onClick={applyFilter}
        >
          적용
        </button>
      </div>

      {/* 개수 */}
      <div className="mb-3 text-sm text-gray-400">총 {total.toLocaleString()}개</div>

      {/* 리스트 */}
      <section className="space-y-3">
        {items.map((r) => (
          <article
            key={r.id}
            className="rounded-2xl border border-gray-700 p-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{r.product}</h3>
              <div>⭐ {r.rating}</div>
            </div>
            <div className="mt-1 text-sm text-gray-400">
              by {r.author} · {new Date(r.created_at).toLocaleString()}
            </div>
            <p className="mt-2 leading-relaxed whitespace-pre-wrap">{r.content}</p>
          </article>
        ))}

        <div className="mt-6 flex justify-center">
          {hasMore ? (
            <button
              onClick={() => setPage((p) => p + 1)}
              className="rounded-xl border border-gray-600 px-4 py-2"
            >
              더보기
            </button>
          ) : (
            <div className="text-gray-500 text-sm">더 이상 항목이 없습니다.</div>
          )}
        </div>
      </section>
    </main>
  )
}
