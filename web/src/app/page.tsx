'use client';

import { useEffect, useState } from 'react';

type Review = {
  id: number;
  author: string;
  product: string;
  rating: number;
  content: string;
  created_at: string;
};

export default function Page() {
  const [form, setForm] = useState({
    author: '',
    product: '',
    rating: 5,
    content: '',
  });
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch('/api/reviews', { cache: 'no-store' });
    const json = await res.json();
    setReviews(json.reviews ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '저장에 실패했어요.');
      setForm({ author: '', product: '', rating: 5, content: '' });
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl p-6 space-y-8">
      <h1 className="text-2xl font-bold">ReviewSpark</h1>

      <form onSubmit={onSubmit} className="space-y-3 rounded-xl border p-4">
        <div className="grid gap-2">
          <input
            className="rounded border p-2"
            placeholder="작성자"
            value={form.author}
            onChange={(e) => setForm((v) => ({ ...v, author: e.target.value }))}
            required
          />
          <input
            className="rounded border p-2"
            placeholder="상품명"
            value={form.product}
            onChange={(e) => setForm((v) => ({ ...v, product: e.target.value }))}
            required
          />
          <input
            className="rounded border p-2"
            type="number"
            min={1}
            max={5}
            placeholder="평점(1~5)"
            value={form.rating}
            onChange={(e) => setForm((v) => ({ ...v, rating: Number(e.target.value) }))}
            required
          />
          <textarea
            className="min-h-24 rounded border p-2"
            placeholder="리뷰 내용"
            value={form.content}
            onChange={(e) => setForm((v) => ({ ...v, content: e.target.value }))}
            required
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          className="w-full rounded-lg bg-black px-4 py-2 font-semibold text-white disabled:opacity-50"
          disabled={loading}
        >
          {loading ? '저장 중…' : '리뷰 등록'}
        </button>
      </form>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">최근 리뷰</h2>
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <div className="font-medium">{r.product}</div>
                <div className="text-sm">⭐ {r.rating}</div>
              </div>
              <div className="text-xs text-gray-500">
                by {r.author} · {new Date(r.created_at).toLocaleString()}
              </div>
              <p className="mt-2 whitespace-pre-wrap">{r.content}</p>
            </li>
          ))}
          {reviews.length === 0 && <li className="text-sm text-gray-500">아직 리뷰가 없어요.</li>}
        </ul>
      </section>
    </main>
  );
}
