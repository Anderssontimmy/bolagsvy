import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import type { Metadata } from 'next'
import { WatchlistButton } from '@/components/WatchlistButton'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { isPro } from '@/lib/utils/pro'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface Props {
  params: Promise<{ slug: string }>
}

async function getCompany(slug: string) {
  const { data } = await supabase
    .from('companies')
    .select('*')
    .eq('slug', slug)
    .single()
  return data
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const company = await getCompany(slug)
  if (!company) return {}
  return {
    title: `${company.name} — Bolagsvy`,
    description: `Information om ${company.name}. Org.nr: ${company.org_number}. ${company.city ?? ''}. Se styrelse, SNI-kod och mer.`,
  }
}

export default async function CompanyPage({ params }: Props) {
  const { slug } = await params
  const company = await getCompany(slug)
  if (!company) notFound()

  const boardMembers: Array<{ namn: string; roll: string }> = company.board_members ?? []

  const authSupabase = await createServerClient()
  const { data: { user } } = await authSupabase.auth.getUser()

  let userIsPro = false
  let isWatching = false

  if (user) {
    const { data: sub } = await supabase.from('subscriptions').select('plan, current_period_end').eq('user_id', user.id).single()
    userIsPro = isPro(sub)

    if (userIsPro) {
      const { data: watch } = await supabase.from('watchlist').select('id').eq('user_id', user.id).eq('company_id', company.id).single()
      isWatching = !!watch
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-2">
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          company.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {company.status === 'active' ? 'Aktiv' : company.status}
        </span>
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-1">{company.name}</h1>
      <p className="text-gray-400 text-sm mb-8">Org.nr: {company.org_number}</p>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {[
          { label: 'Bransch', value: company.sni_description },
          { label: 'Stad', value: company.city },
          { label: 'Registrerad', value: company.registered_at },
          { label: 'Adress', value: company.address },
        ].map(({ label, value }) => value && (
          <div key={label} className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
            <p className="text-gray-800 font-medium">{value}</p>
          </div>
        ))}
      </div>

      {boardMembers.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Styrelse</h2>
          <div className="flex flex-col gap-2">
            {boardMembers.map((m, i) => (
              <div key={i} className="flex justify-between text-sm border-b border-gray-100 pb-2">
                <span className="text-gray-800">{m.namn}</span>
                <span className="text-gray-400">{m.roll}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5">
        <p className="font-semibold text-gray-900 mb-1">Bevaka {company.name}</p>
        <p className="text-sm text-gray-500 mb-3">Få e-post när styrelse, adress eller status ändras.</p>
        <WatchlistButton companyId={company.id} isWatching={isWatching} isPro={userIsPro} />
        {!userIsPro && (
          <p className="text-xs text-gray-400 text-center mt-2">299 kr/mån · Avsluta när du vill</p>
        )}
      </div>
    </main>
  )
}
