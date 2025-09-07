// reviewspark/web/src/app/api/reviews/[id]/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Vercel에 추가한 서비스 롤 키

async function verifyKey(id: number, clientSubmitKey?: string | null) {
  if (!clientSubmitKey) return { ok: false, status: 401, msg: "x-submit-key 헤더가 없습니다." };

  const admin = createClient(url, service); // 서버에서만 사용
  const { data, error } = await admin
    .from("reviews")
    .select("submit_key")
    .eq("id", id)
    .single();

  if (error) return { ok: false, status: 500, msg: error.message };
  if (!data || data.submit_key !== clientSubmitKey)
    return { ok: false, status: 403, msg: "권한이 없습니다." };

  return { ok: true, status: 200, msg: "OK" };
}

// PATCH /api/reviews/:id  (수정)
export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  const id = Number(ctx.params.id);
  const submitKey = req.headers.get("x-submit-key");

  const check = await verifyKey(id, submitKey);
  if (!check.ok) return NextResponse.json({ error: check.msg }, { status: check.status });

  const body = await req.json().catch(() => ({}));
  const { author, product, rating, content } = body;

  const admin = createClient(url, service);
  const { error } = await admin
    .from("reviews")
    .update({ author, product, rating, content })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE /api/reviews/:id  (삭제)
export async function DELETE(_req: Request, ctx: { params: { id: string } }) {
  const id = Number(ctx.params.id);
  const submitKey = _req.headers.get("x-submit-key");

  const check = await verifyKey(id, submitKey);
  if (!check.ok) return NextResponse.json({ error: check.msg }, { status: check.status });

  const admin = createClient(url, service);
  const { error } = await admin.from("reviews").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
