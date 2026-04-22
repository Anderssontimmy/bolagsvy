'use client'
import { useState } from 'react'

interface Props {
  companyId: string
  isWatching: boolean
  isPro: boolean
}

export function WatchlistButton({ companyId, isWatching: initial, isPro }: Props) {
  const [watching, setWatching] = useState(initial)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    if (!isPro) {
      window.location.href = '/auth/registrera'
      return
    }
    setLoading(true)
    const method = watching ? 'DELETE' : 'POST'
    await fetch('/api/watchlist', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company_id: companyId }),
    })
    setWatching(!watching)
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
        watching
          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          : 'bg-indigo-600 text-white hover:bg-indigo-700'
      } disabled:opacity-50`}
    >
      {loading ? '...' : watching ? 'Bevakar — klicka för att sluta' : isPro ? 'Bevaka detta bolag' : 'Bevaka (kräver Pro)'}
    </button>
  )
}
