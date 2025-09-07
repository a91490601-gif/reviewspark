// web/src/app/page.tsx
'use client';

import { useEffect, useState } from 'react';

type Review = {
  id: number;
  created_at: string;
  author: string;
  product: string;
  rating: number;
  content: string;
};

export default function Page() {
  // 폼 상태
  const [author, setAuthor] = useState('');
  const [product, setProduct] = useState('');
  const [rating, setRating] = useState<number | ''>(5);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 리스트 상태
  const [reviews, setReviews] = useState<Review[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // 최초 1페이지 로드
  useEffect(() => {
    loadPage(1, true);
  }, []);

  async function loadPage(nextPage: number, replace = false) {
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/reviews?page=${nextPage}&limit=10`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || '로드 실패');

      setHasMore(Boolean(json.hasMore));
      setPage(nextPage);
      if (replace) setReviews(json.reviews);
      else setReviews(prev => [...prev, ...json.reviews]);
    } catch (e) {
      console.error(e);
      alert('리뷰를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoadingMore(false);
    }
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!author || !product || !content || rating === '') {
      alert('모든 필드를 입력하세요.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author,
          product,
          rating: Number(rating),
          content,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || '등록 실패');

      // 성공: 폼 초기화 + 1페이지 새로 로드 (중복 방지)
      setAuthor('');
      setProduct('');
      setRating(5);
      setContent('');
      await loadPage(1, true);
    } catch (e: any) {
      alert(e.message || '등록 실패');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto p-6 text-gray-100">
      <h1 className="text-3xl font-bold mb-6">ReviewSpark</h1>

      {/* 입력 폼 */}
      <form onSubmit={submitReview} className="space-y-4 border border-gray-600 rounded-2xl p-5 mb-10">
        <input
          className="w-full rounded-lg bg-gray-800 p-3"
          placeholder="작성자"
          value={author}
          onChange={e => setAuthor(e.target.value)}
        />
        <input
          className="w-full rounded-lg bg-gray-800 p-3"
          placeholder="상품명"
          value={product}
          onChange={e => setProduct(e.target.value)}
        />
        <input
          className="w-full rounded-lg bg-gray-800 p-3"
          placeholder="평점(1~5)"
          inputMode="numeric"
          value={rating}
          onChange={e => {
            const v = Number(e.target.value);
            if (Number.isNaN(v)) setRating('');
            else setRating(v);
          }}
        />
        <textarea
          className="w-full rounded-lg bg-gray-800 p-3 min-h-[120px]"
          placeholder="리뷰 내용"
          value={content}
          onChange={e => setContent(e.target.value)}
        />
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-black/80 p-3 disabled:opacity-60"
        >
          {submitting ? '등록 중…' : '리뷰 등록'}
        </button>
      </form>

      {/* 리스트 */}
      <h2 className="text-2xl font-semibold mb-4">최근 리뷰</h2>
      <div className="space-y-4">
        {reviews.map(r => (
          <article key={r.id} className="border border-gray-700 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-1">
              <div className="text-lg font-semibold">{r.product}</div>
              <div>⭐ {r.rating}</div>
            </div>
            <div className="text-sm text-gray-400 mb-2">
              by {r.author} · {new Date(r.created_at).toLocaleString()}
            </div>
            <div className="whitespace-pre-wrap">{r.content}</div>
          </article>
        ))}
      </div>

      {/* 더보기 */}
      <div className="mt-6 flex justify-center">
        {hasMore ? (
          <button
            className="rounded-xl border border-gray-600 px-4 py-2 disabled:opacity-60"
            onClick={() => loadPage(page + 1)}
            disabled={loadingMore}
          >
            {loadingMore ? '불러오는 중…' : '더보기'}
          </button>
        ) : (
          <div className="text-gray-500 text-sm">더 이상 항목이 없습니다.</div>
        )}
      </div>
    </main>
  );
}
