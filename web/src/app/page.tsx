'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

type Review = {
  id: number
  created_at: string
  author: string | null
  product: string | null
  rating: number | null
  content: string | null
}

export default function Home() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('id', { ascending: false })
        .limit(20)
      if (!error && data) setReviews(data as Review[])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <main style={{ padding: 24 }}>
      <h1>ReviewSpark</h1>
      <p>Supabase 연결 OK ✅</p>
      {loading ? <p>불러오는 중...</p> : (
        <ul style={{ display:'grid', gap:12 }}>
          {reviews.map(r => (
            <li key={r.id} style={{ padding:12, border:'1px solid #444', borderRadius:8 }}>
              <b>{r.product ?? '상품명 없음'}</b> · 평점 {r.rating ?? '-'}
              <br />
              <small>by {r.author ?? '익명'} · {new Date(r.created_at).toLocaleString()}</small>
              <p style={{ marginTop:8 }}>{r.content}</p>
            </li>
          ))}
          {reviews.length === 0 && <p>아직 리뷰가 없어요.</p>}
        </ul>
      )}
    </main>
  )
}
