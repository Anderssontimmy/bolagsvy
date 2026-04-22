import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendDigest } from '@/lib/resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: subs } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('plan', 'pro')
    .gt('current_period_end', new Date().toISOString())

  if (!subs?.length) return NextResponse.json({ sent: 0 })

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  let sent = 0

  for (const { user_id } of subs) {
    const { data: watchlist } = await supabase
      .from('watchlist')
      .select('company_id, companies(name)')
      .eq('user_id', user_id)

    if (!watchlist?.length) continue

    const companyIds = watchlist.map(w => w.company_id)
    const companyNames: Record<string, string> = {}
    watchlist.forEach(w => {
      const c = w.companies as unknown as { name: string }
      companyNames[w.company_id] = c.name
    })

    const { data: changes } = await supabase
      .from('company_changes')
      .select('company_id, change_type, detected_at')
      .in('company_id', companyIds)
      .gte('detected_at', sevenDaysAgo)

    if (!changes?.length) continue

    const { data: { user } } = await supabase.auth.admin.getUserById(user_id)
    if (!user?.email) continue

    await sendDigest(user.email, changes.map(c => ({
      companyName: companyNames[c.company_id] ?? 'Okänt bolag',
      changeType: c.change_type,
      detectedAt: c.detected_at,
    })))

    sent++
  }

  return NextResponse.json({ sent })
}
