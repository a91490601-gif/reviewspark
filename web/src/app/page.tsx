// web/src/app/page.tsx
"use client";

import { useEffect, useState } from "react";

type Review = {
  id: number;
  author: string | null;
  product: string | null;
  rating: number | null;
  content: string | null;
  created_at?: string;
};

export default function Page() {
  const [author, setAuthor] = useState("");
  const [product, setProduct] = useState("");
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);

  // 편집 상태
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editAuthor, setEditAuthor] = useState("");
  const [editProduct, setEditProduct] = useState("");
  const [editRating, setEditRating] = useState(5);
  const [editContent, setEditContent] = useState("");

  // 목록 불러오기
  const load = async () => {
    try {
      const res = await fetch("/api/reviews", { cache: "no-store" });
      const json = await res.json();
      setReviews(json?.data ?? []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // 등록
  const submit = async () => {
    if (!product || !content) return;
    setLoading(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author, product, rating, content }),
      });
      if (!res.ok) throw new Error("submit failed");
      setAuthor("");
      setProduct("");
      setRating(5);
      setContent("");
      await load();
    } catch (e) {
      console.error(e);
      alert("등록 실패");
    } finally {
      setLoading(false);
    }
  };

  // 편집 시작
  const startEdit = (r: Review) => {
    setEditingId(r.id);
    setEditAuthor(r.author ?? "");
    setEditProduct(r.product ?? "");
    setEditRating(r.rating ?? 5);
    setEditContent(r.content ?? "");
  };

  // 편집 취소
  const cancelEdit = () => {
    setEditingId(null);
  };

  // 저장(수정)
  const saveEdit = async () => {
    if (editingId == null) return;
    try {
      const res = await fetch(`/api/reviews/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: editAuthor,
          product: editProduct,
          rating: editRating,
          content: editContent,
        }),
      });
      if (!res.ok) throw new Error("update failed");
      setEditingId(null);
      await load();
    } catch (e) {
      console.error(e);
      alert("수정 실패");
    }
  };

  // 삭제
  const remove = async (id: number) => {
    if (!confirm("정말 삭제할까요?")) return;
    try {
      const res = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      await load();
    } catch (e) {
      console.error(e);
      alert("삭제 실패");
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-extrabold mb-6">ReviewSpark</h1>

      {/* 입력 폼 */}
      <div className="rounded-2xl border border-gray-700 p-4 mb-8">
        <input
          className="w-full bg-gray-900 rounded-lg p-3 mb-3 outline-none"
          placeholder="작성자"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />
        <input
          className="w-full bg-gray-900 rounded-lg p-3 mb-3 outline-none"
          placeholder="상품
