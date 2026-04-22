import { CompanyCard } from '@/components/CompanyCard'
import { SearchBar } from '@/components/SearchBar'
import { FilterPanel } from '@/components/FilterPanel'
import { createClient } from '@/lib/supabase/server'
import { isPro } from '@/lib/utils/pro'

interface Props {
  searchParams: Promise<{ q?: string; city?: string; sni?: string }>
}

export default async function SokPage({ searchParams }: Props) {
  const { q = '', city, sni } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userIsPro = false
  if (user) {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plan, current_period_end')
      .eq('user_id', user.id)
      .single()
    userIsPro = isPro(sub)
  }

  const url = new URL(`${process.env.NEXT_PUBLIC_APP_URL}/api/companies/search`)
  if (q) url.searchParams.set('q', q)
  if (userIsPro && city) url.searchParams.set('city', city)
  if (userIsPro && sni) url.searchParams.set('sni', sni)

  const res = await fetch(url.toString(), { cache: 'no-store' })
  const { companies = [], total = 0 } = await res.json()

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-6"><SearchBar /></div>
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1">
          {userIsPro ? (
            <FilterPanel />
          ) : (
            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 text-center">
              <p className="text-sm font-medium text-gray-800 mb-2">Avancerade filter</p>
              <p className="text-xs text-gray-500 mb-3">Filtrera på stad, bransch och mer med Pro</p>
              <a href="/auth/registrera" className="text-xs font-medium text-indigo-600 hover:underline">
                Uppgradera →
              </a>
            </div>
          )}
          {userIsPro && q && (
            <a
              href={`/api/export?q=${encodeURIComponent(q)}${city ? `&city=${city}` : ''}${sni ? `&sni=${sni}` : ''}`}
              className="mt-2 block text-center text-xs text-indigo-600 hover:underline"
            >
              Exportera som CSV
            </a>
          )}
        </div>
        <div className="col-span-2 flex flex-col gap-2">
          {q && <p className="text-sm text-gray-400">{total} bolag</p>}
          {companies.map((c: { id: string; name: string; slug: string; city?: string; sni_description?: string; status: string }) => (
            <CompanyCard key={c.id} name={c.name} slug={c.slug} city={c.city} sniDescription={c.sni_description} status={c.status} />
          ))}
        </div>
      </div>
    </main>
  )
}
