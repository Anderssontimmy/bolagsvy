import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCompany } from '@/lib/bolagsverket/client'
import { toSlug } from '@/lib/utils/slug'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch companies due for sync (oldest synced first, batch of 100)
  const { data: companies } = await supabase
    .from('companies')
    .select('id, org_number, board_members, address, city, status')
    .order('last_synced_at', { ascending: true })
    .limit(100)

  if (!companies) return NextResponse.json({ synced: 0 })

  let synced = 0
  for (const company of companies) {
    const fresh = await getCompany(company.org_number)
    if (!fresh) continue

    const newAddress = fresh.adress?.gatuadress ?? null
    const newCity = fresh.adress?.postort ?? null
    const newBoard = fresh.styrelseledamoter ?? []
    const newStatus = fresh.status

    const changes: Array<{ company_id: string; change_type: string; old_value: unknown; new_value: unknown }> = []

    if (newAddress !== company.address) {
      changes.push({ company_id: company.id, change_type: 'address_change', old_value: company.address, new_value: newAddress })
    }
    if (JSON.stringify(newBoard) !== JSON.stringify(company.board_members)) {
      changes.push({ company_id: company.id, change_type: 'board_change', old_value: company.board_members, new_value: newBoard })
    }
    if (newStatus !== company.status) {
      changes.push({ company_id: company.id, change_type: 'status_change', old_value: company.status, new_value: newStatus })
    }

    if (changes.length > 0) {
      await supabase.from('company_changes').insert(changes)
    }

    await supabase.from('companies').update({
      name: fresh.foretagsnamn,
      status: newStatus,
      address: newAddress,
      city: newCity,
      county: fresh.adress?.lan ?? null,
      sni_code: fresh.sniKod ?? null,
      sni_description: fresh.sniBeskriving ?? null,
      board_members: newBoard,
      last_synced_at: new Date().toISOString(),
    }).eq('id', company.id)

    synced++
  }

  return NextResponse.json({ synced })
}
