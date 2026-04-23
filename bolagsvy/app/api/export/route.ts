import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as serviceClient } from '@supabase/supabase-js'
import { isPro } from '@/lib/utils/pro'

const supabase = serviceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const authSupabase = await createClient()
  const { data: { user } } = await authSupabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: sub } = await supabase.from('subscriptions').select('plan, current_period_end').eq('user_id', user.id).single()
  if (!isPro(sub)) return NextResponse.json({ error: 'Pro required' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') ?? ''
  const city = searchParams.get('city')
  const sni = searchParams.get('sni')
  const employees = searchParams.get('employees')

  let query = supabase.from('companies').select('name, org_number, city, county, sni_description, address, registered_at, status, employees_class').eq('status', 'active').limit(1000)
  if (q) query = query.ilike('name', `%${q}%`)
  if (city) query = query.ilike('city', `%${city}%`)
  if (sni) query = query.eq('sni_code', sni)
  if (employees) query = query.eq('employees_class', employees)

  const { data: companies } = await query

  const rows = [
    ['Namn', 'Org.nr', 'Stad', 'Bransch', 'Adress', 'Registrerad', 'Status', 'Anställda'],
    ...(companies ?? []).map(c => [c.name, c.org_number, c.city ?? '', c.sni_description ?? '', c.address ?? '', c.registered_at ?? '', c.status, c.employees_class ?? '']),
  ]
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="bolagsvy-export.csv"',
    },
  })
}
