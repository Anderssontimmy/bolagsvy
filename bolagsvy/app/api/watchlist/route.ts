import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as serviceClient } from '@supabase/supabase-js'
import { isPro } from '@/lib/utils/pro'

const supabase = serviceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getUser() {
  const authSupabase = await createClient()
  return authSupabase.auth.getUser()
}

export async function GET() {
  const { data: { user } } = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('watchlist')
    .select('company_id, companies(name, slug, city, status)')
    .eq('user_id', user.id)

  return NextResponse.json({ watchlist: data ?? [] })
}

export async function POST(req: NextRequest) {
  const { data: { user } } = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: sub } = await supabase.from('subscriptions').select('plan, current_period_end').eq('user_id', user.id).single()
  if (!isPro(sub)) return NextResponse.json({ error: 'Pro required' }, { status: 403 })

  const { company_id } = await req.json()
  await supabase.from('watchlist').upsert({ user_id: user.id, company_id }, { onConflict: 'user_id,company_id' })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const { data: { user } } = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { company_id } = await req.json()
  await supabase.from('watchlist').delete().eq('user_id', user.id).eq('company_id', company_id)
  return NextResponse.json({ ok: true })
}
