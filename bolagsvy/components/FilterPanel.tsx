'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { EMPLOYEES_LABELS } from '@/lib/scb/client'

export function FilterPanel() {
  const router = useRouter()
  const params = useSearchParams()
  const [city, setCity] = useState(params.get('city') ?? '')
  const [sni, setSni] = useState(params.get('sni') ?? '')
  const [employees, setEmployees] = useState(params.get('employees') ?? '')

  function apply() {
    const p = new URLSearchParams(params.toString())
    if (city) p.set('city', city); else p.delete('city')
    if (sni) p.set('sni', sni); else p.delete('sni')
    if (employees) p.set('employees', employees); else p.delete('employees')
    router.push(`/sok?${p.toString()}`)
  }

  return (
    <div className="flex flex-col gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filter (Pro)</p>
      <input
        value={city}
        onChange={e => setCity(e.target.value)}
        placeholder="Stad (t.ex. Stockholm)"
        className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
      />
      <input
        value={sni}
        onChange={e => setSni(e.target.value)}
        placeholder="SNI-kod (t.ex. 62010)"
        className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
      />
      <select
        value={employees}
        onChange={e => setEmployees(e.target.value)}
        className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700"
      >
        <option value="">Antal anställda (alla)</option>
        {Object.entries(EMPLOYEES_LABELS).map(([val, label]) => (
          <option key={val} value={val}>{label}</option>
        ))}
      </select>
      <button
        onClick={apply}
        className="py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
      >
        Tillämpa filter
      </button>
    </div>
  )
}
