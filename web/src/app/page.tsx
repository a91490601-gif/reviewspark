"use client";

import { useEffect, useState } from "react";

type Review = {
  id: number;
  author: string | null;
  product: string | null;
  rating: number | null;
  content: string | null;
  created_at: string;
};

export default function Page() {
  const [author, setAuthor] = useState("");
  const [product, setProduct] = useState("");
  const [rating, setRating] = useState<number>(5);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<Review[]>([]);

  async function load() {
    const res = await fetch("/api/reviews?limit=50", { cache: "no-store" });
    const json = await res.json();
    setList(json.data ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate() {
    if (!author || !product || !content) {
      alert("작성자/상품명/리뷰 내용을 입력하세요.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author, product, rating, content }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "등록 실패");
      // 폼 초기화 후 목록 갱신
      setAuthor("");
      setProduct("");
      setRating(5);
      setContent("");
      await load();
    } catch (e: any) {
      alert(e.message || "에러가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleEdit(r: Review) {
    const newAuthor = prompt("작성자", r.author ?? "") ?? r.author ?? "";
    const newProduct = prompt("상품명", r.product ?? "") ?? r.product ?? "";
    const newRatingStr = prompt("별점(1~5)", String(r.rating ?? 5)) ?? String(r.rating ?? 5);
    const newRating = Number(newRatingStr);
    if (Number.isNaN(newRating) || newRating < 1 || newRating > 5) {
      alert("별점은 1~5 숫자만 가능합니다.");
      return;
    }
    const newContent = prompt("리뷰 내용", r.content ?? "") ?? r.content ?? "";

    try {
      const res = await fetch(`/api/reviews/${r.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: newAuthor,
          product: newProduct,
          rating: newRating,
          content: newContent,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "수정 실패");
      await load();
    } catch (e: any) {
      alert(e.message || "수정 중 에러");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "삭제 실패");
      await load();
    } catch (e: any) {
      alert(e.message || "삭제 중 에러");
    }
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-10">
      <h1 className="text-4xl font-bold mb-8">ReviewSpark</h1>

      {/* 작성 폼 */}
      <section className="border border-neutral-700 rounded-2xl p-5 max-w-2xl">
        <div className="space-y-3">
          <input
            className="w-full rounded-xl bg-neutral-800 px-4 py-3"
            placeholder="작성자"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />
          <input
            className="w-full rounded-xl bg-neutral-800 px-4 py-3"
            placeholder="상품명"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
          />
          <input
            className="w-full rounded-xl bg-neutral-800 px-4 py-3"
            placeholder="별점 (1~5)"
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            inputMode="numeric"
          />
          <textarea
            className="w-full rounded-xl bg-neutral-800 px-4 py-3 min-h-[140px]"
            placeholder="리뷰 내용"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full rounded-xl bg-white text-black font-semibold py-3 disabled:opacity-60"
          >
            {loading ? "등록 중..." : "리뷰 등록"}
          </button>
        </div>
      </section>

      {/* 리스트 */}
      <section className="mt-10 max-w-2xl space-y-4">
        <h2 className="text-2xl font-bold mb-2">최근 리뷰</h2>
        {list.map((r) => (
          <article
            key={r.id}
            className="border border-neutral-800 rounded-2xl p-5"
          >
            <div className="flex items-center justify-between">
              <div className="text-xl font-semibold">{r.product}</div>
              <div className="flex items-center gap-2">
                <span className="text-yellow-400">★ {r.rating ?? "-"}</span>
              </div>
            </div>
            <div className="text-neutral-400 mt-1">
              by {r.author ?? "알 수 없음"} ·{" "}
              {new Date(r.created_at).toLocaleString()}
            </div>
            <p className="mt-3 whitespace-pre-wrap">{r.content}</p>

            {/* 수정/삭제 버튼 */}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => handleEdit(r)}
                className="px-3 py-2 rounded-lg border border-neutral-700 hover:bg-neutral-800"
              >
                수정
              </button>
              <button
                onClick={() => handleDelete(r.id)}
                className="px-3 py-2 rounded-lg border border-red-600 text-red-400 hover:bg-red-950/40"
              >
                삭제
              </button>
            </div>
          </article>
        ))}
        {list.length === 0 && (
          <div className="text-neutral-400">등록된 리뷰가 없습니다.</div>
        )}
      </section>
    </main>
  );
  }
