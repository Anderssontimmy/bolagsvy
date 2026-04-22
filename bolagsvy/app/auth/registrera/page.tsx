'use client'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export default function RegistreraPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    setSent(true)
  }

  if (sent) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Välkommen!</h1>
          <p className="text-gray-500">Kolla din e-post för att fortsätta till Pro.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Starta Pro</h1>
        <p className="text-gray-500 mb-6">299 kr/mån · Avsluta när du vill</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="din@email.se"
            required
            className="px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
          >
            Skapa konto &amp; fortsätt till betalning
          </button>
        </form>
      </div>
    </main>
  )
}
