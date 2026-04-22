import Link from 'next/link'

interface Props {
  name: string
  slug: string
  city?: string | null
  sniDescription?: string | null
  status: string
}

export function CompanyCard({ name, slug, city, sniDescription, status }: Props) {
  return (
    <Link
      href={`/bolag/${slug}`}
      className="block p-4 border border-gray-100 rounded-lg hover:border-indigo-200 hover:bg-indigo-50 transition-colors"
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="font-semibold text-gray-900">{name}</p>
          <p className="text-sm text-gray-500 mt-0.5">
            {[sniDescription, city].filter(Boolean).join(' · ')}
          </p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {status === 'active' ? 'Aktiv' : status}
        </span>
      </div>
    </Link>
  )
}
