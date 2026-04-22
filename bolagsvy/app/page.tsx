import { SearchBar } from '@/components/SearchBar'

export const metadata = {
  title: 'Bolagsvy — Sök bland 600 000 svenska bolag',
  description: 'Gratis bolagssökning med avancerad filtrering och bevakning. Det moderna alternativet till Allabolag.se.',
}

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-white">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          Sök bland 600 000 svenska bolag
        </h1>
        <p className="text-gray-500 text-lg">
          Gratis grundinfo. Avancerad filtrering och bevakning med Pro.
        </p>
      </div>
      <SearchBar />
      <p className="mt-4 text-sm text-gray-400">
        Gratis · Ingen registrering krävs
      </p>
    </main>
  )
}
