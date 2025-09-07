import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function PUT(req: Request, ctx: { params: { id: string } }) {
  const id = Number(ctx.params.id);
  const body = await req.json();
  const { author, product, rating, content } = body ?? {};

  const payload: Record<string, any> = {};
  if (author !== undefined) payload.author = author;
  if (product !== undefined) payload.product = product;
  if (rating !== undefined) payload.rating = Number(rating);
  if (content !== undefined) payload.content = content;

  const { data, error } = await supabase
    .from("reviews")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data });
}

export async function DELETE(_req: Request, ctx: { params: { id: string } }) {
  const id = Number(ctx.params.id);

  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
