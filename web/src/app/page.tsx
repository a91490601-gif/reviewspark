'use client';
import { useState, useRef } from 'react';

export default function Page() {
  const [author, setAuthor] = useState('');
  const [product, setProduct] = useState('');
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isSubmitting) return;         // 중복 가드
    setIsSubmitting(true);

    try {
      await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ author, product, rating, content })
      });
      // 입력값 초기화
      setAuthor(''); setProduct(''); setRating(5); setContent('');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* ...입력 필드들... */}
      <button
        type="submit"
        disabled={isSubmitting}
        className={isSubmitting ? 'opacity-50 pointer-events-none' : ''}
      >
        {isSubmitting ? '등록 중…' : '리뷰 등록'}
      </button>
    </form>
  );
}
