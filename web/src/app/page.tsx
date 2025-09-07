'use client';

import { useEffect, useState } from 'react';

type Review = {
  id: number;
  author: string | null;
  product: string | null;
  rating: number | null;
  content: string | null;
  created_at: string;
};

export default function Page() {
  const [author, setAuthor] = useState('');
  const [product, setProduct] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<Review[]>([]);

  async function load() {
    const res = await fetch('/api/reviews?limit=50', { cache: 'no-store' });
    const json = await res.json();
    setList(json.data ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate() {
    if (!author || !product || !content) {
      alert('작성자/상품명/리뷰 내용을 입력하세요.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author, product, rating, content }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '등록 실패');
      setAuthor('');
      setProduct('');
      setRating(5);
      setContent('');
      await load();
    } catch (e: any) {
      alert(e.message || '에러가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function handleEdit(r: Review) {
    const newAuthor = prompt('작성자', r.author ?? '') ?? r.author ?? '';
    const newProduct = prompt('상품명', r.product ?? '') ?? r.product ?? '';
    const newRatingStr =
      prompt('별점(1~5)', String(r.rating ?? 5)) ?? String(r.rating ?? 5);
    const newRating = Number(newRatingStr);
    if (Number.isNaN(newRating) || newRating < 1 || newRating > 5) {
      alert('별점은 1~5 숫자만 가능합니다.');
      return;
    }
    const newContent =
      prompt('리뷰 내용', r.content ?? '') ?? r.content ?? '';

    try {
      const res = await fetch(`/api/reviews/${r.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: newAuthor,
          product: newProduct,
          rating: newRating,
          content: newContent,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '수정 실패');
      await load();
    } catch (e: any) {
      alert(e.message || '수정 중 에러');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('정말 삭제할까요?')) return;
    try {
      const res = await fetch(`/api/reviews/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '삭제 실패');
      await load();
    } catch (e: any) {
      alert(e.message || '삭제 중 에러');
    }
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-10 text-white">
      <h1 className="text-3xl font-bold mb-6">ReviewSpark</h1>

      {/* 입력 폼 */}
      <div className="space-y-3 rounded-xl border border-white/10 p-4">
        <input
          className="w-full rounded-md bg-white/10 px-3 py-3 outline-none"
          placeholder="작성자"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />
        <input
          className="w-full rounded-md bg-white/10 px-3 py-3 outline-none"
          placeholder="상품명"
          value={product}
          onChange={(e) => setProduct(e.target.value)}
        />
        <input
          className="w-full rounded-md bg-white/10 px-3 py-3 outline-none"
          placeholder="별점(1~5)"
          inputMode="numeric"
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
        />
        <textarea
          className="h-28 w-full rounded-md bg-white/10 px-3 py-3 outline-none"
          placeholder="리뷰 내용"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button
          onClick={handleCreate}
          disabled={loading}
          className="w-full rounded-md bg-white text-black py-3 font-semibold disabled:opacity-60"
        >
          {loading ? '등록 중…' : '리뷰 등록'}
        </button>
      </div>

      {/* 목록 */}
      <h2 className="mt-10 mb-4 text-2xl font-semibold">최근 리뷰</h2>
      <div className="space-y-4">
        {list.map((r) => (
          <div
            key={r.id}
            className="rounded-xl border border-white/10 p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="text-lg font-semibold">{r.product || '상품'}</div>
              <div className="text-yellow-400 font-bold">★ {r.rating ?? 0}</div>
            </div>
            <div className="mt-1 text-sm text-white/70">
              by {r.author || '익명'} ·{' '}
              {new Date(r.created_at).toLocaleString()}
            </div>
            <div className="mt-3 whitespace-pre-wrap">{r.content}</div>

            {/* 여기! 항상 보이는 수정/삭제 버튼 */}
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => handleEdit(r)}
                className="rounded-md border border-white/20 px-3 py-1 text-sm hover:bg-white/10"
              >
                수정
              </button>
              <button
                onClick={() => handleDelete(r.id)}
                className="rounded-md border border-red-400/50 px-3 py-1 text-sm text-red-300 hover:bg-red-400/10"
              >
                삭제
              </button>
            </div>
          </div>
        ))}
        {list.length === 0 && (
          <div className="text-white/60">아직 리뷰가 없어요.</div>
        )}
      </div>
    </main>
  );
}
