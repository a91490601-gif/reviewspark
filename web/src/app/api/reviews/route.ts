import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: Request) {
  const { author, product, rating, content, submitKey } = await req.json();

  if (!submitKey) {
    return NextResponse.json({ error: 'submitKey required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('reviews')
    .upsert(
      [{ author, product, rating, content, submit_key: submitKey }],
      { onConflict: 'submit_key', ignoreDuplicates: true }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ review: data }, { status: 201 });
}
