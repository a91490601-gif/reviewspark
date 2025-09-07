"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [list, setList] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch("/api/reviews", { cache: "no-store" });
    const data = await res.json();
    setList(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function onSubmit() {
    if (!author || !product || !content) return alert("모두 입력해주세요");
    setLoading(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author, product, rating, content }),
      });
      if (!res.ok) throw new Error("등록 실패");
      const { id, submit_key } = await res.json();

      // 이 기기에서만 보관 → 내 글만 수정/삭제 버튼이 보임
      localStorage.setItem(`review_key_${id}`, submit_key);

      setAuthor("");
      setProduct("");
      setRating(5);
      setContent("");
      await load();
    } catch (e: any) {
      alert(e.message ?? "오류");
    } finally {
      setLoading(false);
    }
  }

  function hasMyKey(id: number) {
    return !!localStorage.getItem(`review_key_${id}`);
  }

  async function onEdit(r: Review) {
    const newContent = prompt("리뷰 내용 수정", r.content);
    if (newContent == null) return;
    const newRatingStr = prompt("별점 수정(1~5)", String(r.rating));
    if (newRatingStr == null) return;
    const newRating = Number(newRatingStr);
    if (!(newRating >= 1 && newRating <= 5)) return alert("1~5 사이 숫자");

    const key = localStorage.getItem(`review_key_${r.id}`);
    if (!key) return alert("수정 권한 키가 없습니다(다른 기기?)");

    const res = await fetch(`/api/reviews/${r.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-Submit-Key": key,
      },
      body: JSON.stringify({
        author: r.author, // 작성자/상품명은 그대로 두고
        product: r.product,
        rating: newRating,
        content: newContent,
      }),
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      return alert(j.error ?? "수정 실패");
    }
    await load();
  }

  async function onDelete(r: Review) {
    if (!confirm("정말 삭제할까요?")) return;
    const key = localStorage.getItem(`review_key_${r.id}`);
    if (!key) return alert("삭제 권한 키가 없습니다(다른 기기?)");

    const res = await fetch(`/api/reviews/${r.id}`, {
      method: "DELETE",
      headers: { "X-Submit-Key": key },
    });
    if (!res.ok && res.status !== 204) {
      const j = await res.json().catch(() => ({}));
      return alert(j.error ?? "삭제 실패");
    }
    // 사용한 키도 정리
    localStorage.removeItem(`review_key_${r.id}`);
    await load();
  }

  return (
    <main className="mx-auto max-w-screen-sm p-5 text-gray-100">
      <h1 className="text-3xl font-extrabold mb-6">ReviewSpark</h1>

      <section className="rounded-2xl border border-gray-700 p-4 mb-8">
        <input
          className="mb-2 w-full rounded-xl bg-gray-800 p-3"
          placeholder="작성자"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />
        <input
          className="mb-2 w-full rounded-xl bg-gray-800 p-3"
          placeholder="상품명"
          value={product}
          onChange={(e) => setProduct(e.target.value)}
        />
        <input
          className="mb-2 w-full rounded-xl bg-gray-800 p-3"
          placeholder="별점(1~5)"
          inputMode="numeric"
          value={rating}
          onChange={(e) => setRating(Number(e.target.value || 0))}
        />
        <textarea
          className="mb-3 w-full rounded-xl bg-gray-800 p-3 h-32"
          placeholder="리뷰 내용"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button
          disabled={loading}
          onClick={onSubmit}
          className="w-full rounded-2xl bg-white/10 p-4 font-bold disabled:opacity-50"
        >
          {loading ? "등록 중..." : "리뷰 등록"}
        </button>
      </section>

      <h2 className="text-xl font-bold mb-3">최근 리뷰</h2>
      <div className="space-y-3">
        {list.map((r) => (
          <div key={r.id} className="rounded-2xl border border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div className="text-xl font-bold">{r.product}</div>
              <div>⭐ {r.rating}</div>
            </div>
            <div className="text-gray-400 text-sm mb-2">
              by {r.author} · {new Date(r.created_at).toLocaleString()}
            </div>
            <div className="whitespace-pre-wrap">{r.content}</div>

            {hasMyKey(r.id) && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => onEdit(r)}
                  className="flex-1 rounded-xl bg-white/10 p-2"
                >
                  수정
                </button>
                <button
                  onClick={() => onDelete(r)}
                  className="flex-1 rounded-xl bg-red-500/70 p-2"
                >
                  삭제
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
