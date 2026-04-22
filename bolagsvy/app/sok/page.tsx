import { CompanyCard } from '@/components/CompanyCard'
import { SearchBar } from '@/components/SearchBar'

interface Props {
  searchParams: Promise<{ q?: string }>
}

export default async function SokPage({ searchParams }: Props) {
  const { q = '' } = await searchParams

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/companies/search?q=${encodeURIComponent(q)}`,
    { cache: 'no-store' }
  )
  const { companies = [], total = 0 } = await res.json()

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-6">
        <SearchBar />
      </div>
      {q && (
        <p className="text-sm text-gray-500 mb-4">
          {total} bolag matchar &quot;{q}&quot;
        </p>
      )}
      <div className="flex flex-col gap-2">
        {companies.map((c: { id: string; name: string; slug: string; city?: string; sni_description?: string; status: string }) => (
          <CompanyCard
            key={c.id}
            name={c.name}
            slug={c.slug}
            city={c.city}
            sniDescription={c.sni_description}
            status={c.status}
          />
        ))}
      </div>
      {companies.length === 0 && q && (
        <p className="text-gray-400 text-center mt-10">Inga bolag hittades för &quot;{q}&quot;</p>
      )}
    </main>
  )
}
