import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') ?? ''
  const sni = searchParams.get('sni')
  const city = searchParams.get('city')
  const employees = searchParams.get('employees')
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = 20
  const offset = (page - 1) * limit

  let query = supabase
    .from('companies')
    .select('id, name, org_number, slug, city, sni_description, status, registered_at, employees_class', { count: 'exact' })
    .eq('status', 'active')
    .order('name')
    .range(offset, offset + limit - 1)

  if (q) query = query.ilike('name', `%${q}%`)
  if (sni) query = query.eq('sni_code', sni)
  if (city) query = query.ilike('city', `%${city}%`)
  if (employees) query = query.eq('employees_class', employees)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ companies: data, total: count, page, limit })
}
