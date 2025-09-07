// web/src/app/page.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';

type Review = {
  id: number;
  created_at: string;
  author: string;
  product: string;
  rating: number;
  content: string;
};

export default function Page() {
  const [author, setAuthor] = useState('');
  const [product, setProduct] = useState('');
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [errMsg, setErrMsg] = useState('');

  const load = useCallback(async () => {
    setErrMsg('');
    const res = await fetch('/api/reviews', { cache: 'no-store' });
    const json = await res.json();
    if (!res.ok) {
      setErrMsg(json.error ?? '목록을 불러오지 못했어요.');
      return;
    }
    setReviews(json.reviews ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return; // 중복 제출 방지 (클라이언트)
    setSubmitting(true);
    setErrMsg('');

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author, product, rating, content }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? '등록 실패');

      // 입력값 초기화 후 목록 새로고침
      setAuthor('');
      setProduct('');
      setRating(5);
      setContent('');
      await load();
    } catch (err: any) {
      setErrMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">ReviewSpark</h1>

      <form onSubmit={onSubmit} className="space-y-3 border rounded-xl p-4 bg-zinc-900/30">
        <input
          className="w-full p-3 rounded-lg bg-zinc-800 outline-none"
          placeholder="작성자"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          required
        />
        <input
          className="w-full p-3 rounded-lg bg-zinc-800 outline-none"
          placeholder="상품명"
          value={product}
          onChange={(e) => setProduct(e.target.value)}
          required
        />
        <input
          type="number"
          min={1}
          max={5}
          className="w-full p-3 rounded-lg bg-zinc-800 outline-none"
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          required
        />
        <textarea
          className="w-full p-3 rounded-lg bg-zinc-800 outline-none"
          placeholder="리뷰 내용"
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={submitting}
          className="w-full p-3 rounded-lg bg-black text-white disabled:opacity-50"
        >
          {submitting ? '등록 중…' : '리뷰 등록'}
        </button>
        {errMsg && <p className="text-red-400 text-sm">{errMsg}</p>}
      </form>

      <section>
        <h2 className="text-2xl font-semibold mb-3">최근 리뷰</h2>
        <div className="space-y-3">
          {reviews.map((r) => (
            <article key={r.id} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{r.product}</div>
                <div>⭐ {r.rating}</div>
              </div>
              <div className="text-sm text-zinc-400">
                by {r.author} · {new Date(r.created_at).toLocaleString()}
              </div>
              <p className="mt-2">{r.content}</p>
            </article>
          ))}
          {reviews.length === 0 && (
            <p className="text-sm text-zinc-400">아직 리뷰가 없습니다.</p>
          )}
        </div>
      </section>
    </div>
  );
}
