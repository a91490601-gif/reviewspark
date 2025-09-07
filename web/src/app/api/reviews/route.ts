// reviewspark/web/src/app/api/reviews/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// GET /api/reviews  : 최근 리뷰 50개
export async function GET() {
  const supabase = createClient(url, anon);
  const { data, error } = await supabase
    .from("reviews")
    .select("id, author, product, rating, content, created_at")
    .order("id", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST /api/reviews : 새 리뷰 작성(제출키 생성 & 반환)
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { author = "", product = "", rating = 5, content = "" } = body;

  if (!author || !product || !content) {
    return NextResponse.json(
      { error: "author, product, content는 필수입니다." },
      { status: 400 }
    );
  }

  const submitKey = crypto.randomUUID();
  const supabase = createClient(url, anon);

  const { data, error } = await supabase
    .from("reviews")
    .insert([{ author, product, rating, content, submit_key: submitKey }])
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 클라이언트가 로컬에 저장할 수 있도록 id와 submitKey 반환
  return NextResponse.json({ id: data!.id, submitKey });
}
