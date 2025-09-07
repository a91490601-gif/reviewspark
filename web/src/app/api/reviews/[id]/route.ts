// app/api/reviews/[id]/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 서버 전용 (Service Role)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 공통: id로 리뷰 + submit_key 조회
async function getRow(id: number) {
  const { data, error } = await supabase
    .from("reviews")
    .select("id, submit_key")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

// PATCH /api/reviews/:id  - 일부 필드 수정
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    const key = req.headers.get("x-review-key") ?? "";
    if (!id || !key) {
      return NextResponse.json({ message: "missing id or key" }, { status: 400 });
    }

    const row = await getRow(id);
    if (!row || row.submit_key !== key) {
      return NextResponse.json({ message: "forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const patch: Record<string, any> = {};
    if (typeof body.author === "string") patch.author = body.author;
    if (typeof body.product === "string") patch.product = body.product;
    if (typeof body.content === "string") patch.content = body.content;
    if (typeof body.rating === "number") patch.rating = body.rating;

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ message: "nothing to update" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("reviews")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json({ ok: true, review: data });
  } catch (e: any) {
    return NextResponse.json({ message: e.message ?? "server error" }, { status: 500 });
  }
}

// DELETE /api/reviews/:id  - 삭제
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    const key = req.headers.get("x-review-key") ?? "";
    if (!id || !key) {
      return NextResponse.json({ message: "missing id or key" }, { status: 400 });
    }

    const row = await getRow(id);
    if (!row || row.submit_key !== key) {
      return NextResponse.json({ message: "forbidden" }, { status: 403 });
    }

    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ message: e.message ?? "server error" }, { status: 500 });
  }
}
