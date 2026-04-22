import { createClient } from '@/lib/supabase/server'
import { createClient as serviceClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { isPro } from '@/lib/utils/pro'
import Link from 'next/link'

const supabase = serviceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function DashboardPage() {
  const authSupabase = await createClient()
  const { data: { user } } = await authSupabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: sub } = await supabase.from('subscriptions').select('plan, current_period_end').eq('user_id', user.id).single()
  if (!isPro(sub)) redirect('/auth/registrera')

  const { data: watchlist } = await supabase
    .from('watchlist')
    .select('company_id, created_at, companies(id, name, slug, city, status)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const companyIds = (watchlist ?? []).map(w => w.company_id)

  let changes: Array<{ company_id: string; change_type: string; new_value: unknown; detected_at: string }> = []
  if (companyIds.length > 0) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data } = await supabase
      .from('company_changes')
      .select('company_id, change_type, new_value, detected_at')
      .in('company_id', companyIds)
      .gte('detected_at', sevenDaysAgo)
      .order('detected_at', { ascending: false })
    changes = data ?? []
  }

  const changeLabel: Record<string, string> = {
    board_change: 'Styrelseändring',
    address_change: 'Adressändring',
    status_change: 'Statusändring',
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Min bevakning</h1>

      {changes.length > 0 && (
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Senaste 7 dagarna</h2>
          <div className="flex flex-col gap-2">
            {changes.map(c => (
              <div key={c.company_id + c.detected_at} className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-sm">
                <span className="font-medium text-gray-800">{changeLabel[c.change_type] ?? c.change_type}</span>
                <span className="text-gray-400 ml-2 text-xs">{new Date(c.detected_at).toLocaleDateString('sv-SE')}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Bevakade bolag ({watchlist?.length ?? 0})</h2>
        <div className="flex flex-col gap-2">
          {(watchlist ?? []).map(w => {
            const c = w.companies as unknown as { id: string; name: string; slug: string; city?: string; status: string }
            return (
              <Link key={w.company_id} href={`/bolag/${c.slug}`} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg hover:border-indigo-200">
                <span className="font-medium text-gray-800">{c.name}</span>
                <span className="text-sm text-gray-400">{c.city}</span>
              </Link>
            )
          })}
          {!watchlist?.length && (
            <p className="text-gray-400 text-sm">Du bevakar inga bolag än. Hitta bolag via sökning och klicka &quot;Bevaka&quot;.</p>
          )}
        </div>
      </section>
    </main>
  )
}
