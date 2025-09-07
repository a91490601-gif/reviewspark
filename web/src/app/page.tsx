// app/page.tsx
"use client";

import { useEffect, useState } from "react";

type Review = {
  id: number;
  author: string;
  product: string;
  rating: number;
  content: string;
  created_at: string;
};

export default function Page() {
  const [author, setAuthor] = useState("");
  const [product, setProduct] = useState("");
  const [rating, setRating] = useState<number>(5);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<Review[]>([]);
  const [moreLoading, setMoreLoading] = useState(false);

  async function load() {
    const r = await fetch("/api/reviews?limit=50", { cache: "no-store" });
    const j = await r.json();
    setList(j.reviews ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  // 등록
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const r = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author, product, rating, content }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message || "등록 실패");

      // 관리키 저장 (id별)
      const key = j.submit_key as string;
      const id = j.id as number;
      localStorage.setItem(`reviewKey:${id}`, key);

      alert(`리뷰가 등록되었습니다.\n\n관리 키: ${key}\n\n※ 이 키가 있어야 수정/삭제가 가능합니다. (자동 저장됨)`);

      // 폼 리셋 + 새로고침
      setAuthor("");
      setProduct("");
      setRating(5);
      setContent("");
      await load();
    } catch (e: any) {
      alert(e.message ?? "오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  // 관리 키 가져오기 (없으면 입력 받기)
  function getKeyFor(id: number) {
    let key = localStorage.getItem(`reviewKey:${id}`) ?? "";
    if (!key) {
      key = prompt("관리 키를 입력하세요") ?? "";
      if (key) localStorage.setItem(`reviewKey:${id}`, key);
    }
    return key;
  }

  // 수정
  async function onEdit(r: Review) {
    const key = getKeyFor(r.id);
    if (!key) return;

    const newAuthor = prompt("작성자 수정", r.author) ?? r.author;
    const newProduct = prompt("상품명 수정", r.product) ?? r.product;
    const newRatingStr = prompt("평점(1~5) 수정", String(r.rating)) ?? String(r.rating);
    const newRating = Math.max(1, Math.min(5, Number(newRatingStr) || r.rating));
    const newContent = prompt("리뷰 내용 수정", r.content) ?? r.content;

    try {
      const res = await fetch(`/api/reviews/${r.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-review-key": key },
        body: JSON.stringify({
          author: newAuthor,
          product: newProduct,
          rating: newRating,
          content: newContent,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.message || "수정 실패");
      await load();
    } catch (e: any) {
      alert(e.message ?? "오류가 발생했습니다");
    }
  }

  // 삭제
  async function onDelete(r: Review) {
    if (!confirm("정말 삭제할까요?")) return;
    const key = getKeyFor(r.id);
    if (!key) return;

    try {
      const res = await fetch(`/api/reviews/${r.id}`, {
        method: "DELETE",
        headers: { "x-review-key": key },
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.message || "삭제 실패");
      await load();
    } catch (e: any) {
      alert(e.message ?? "오류가 발생했습니다");
    }
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-extrabold mb-6">ReviewSpark</h1>

      <form onSubmit={onSubmit} className="space-y-3 border p-4 rounded-xl border-gray-700">
        <input
          className="w-full p-3 rounded bg-zinc-900 outline-none"
          placeholder="작성자"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />
        <input
          className="w-full p-3 rounded bg-zinc-900 outline-none"
          placeholder="상품명"
          value={product}
          onChange={(e) => setProduct(e.target.value)}
        />
        <input
          className="w-full p-3 rounded bg-zinc-900 outline-none"
          placeholder="평점 (1~5)"
          inputMode="numeric"
          value={rating}
          onChange={(e) => setRating(Math.max(1, Math.min(5, Number(e.target.value) || 5)))}
        />
        <textarea
          className="w-full p-3 rounded bg-zinc-900 outline-none min-h-[120px]"
          placeholder="리뷰 내용"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button
          className="w-full py-3 rounded-xl bg-white text-black font-bold disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "등록 중..." : "리뷰 등록"}
        </button>
      </form>

      <h2 className="text-2xl font-bold mt-8 mb-4">최근 리뷰</h2>
      <div className="space-y-4">
        {list.map((r) => (
          <div key={r.id} className="border border-gray-700 p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{r.product}</div>
              <div>⭐ {r.rating}</div>
            </div>
            <div className="text-sm text-gray-400 mt-1">
              by {r.author} · {new Date(r.created_at).toLocaleString()}
            </div>
            <div className="mt-3 whitespace-pre-wrap">{r.content}</div>
            <div className="mt-4 flex gap-3">
              <button
                className="px-3 py-2 rounded bg-zinc-800"
                onClick={() => onEdit(r)}
              >
                수정
              </button>
              <button
                className="px-3 py-2 rounded bg-red-600"
                onClick={() => onDelete(r)}
              >
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>

      {moreLoading && <div className="mt-4 text-center text-gray-400">불러오는 중…</div>}
    </main>
  );
}
