// app/api/reviews/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // 서버 전용
);

// GET /api/reviews?limit=20
export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Number(url.searchParams.get("limit") ?? 20);

  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
  return NextResponse.json({ reviews: data ?? [] });
}

// POST /api/reviews
export async function POST(req: Request) {
  try {
    const { author, product, rating, content } = await req.json();

    if (!author || !product || !content || typeof rating !== "number") {
      return NextResponse.json({ message: "invalid body" }, { status: 400 });
    }

    // 관리키 발급 (클라이언트에 노출 금지, API에서만 반환)
    const submit_key =
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

    const { data, error } = await supabase
      .from("reviews")
      .insert([{ author, product, rating, content, submit_key }])
      .select("id")
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, id: data!.id, submit_key });
  } catch (e: any) {
    return NextResponse.json({ message: e.message ?? "server error" }, { status: 500 });
  }
}
