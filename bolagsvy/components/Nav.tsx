import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export async function Nav() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <nav className="border-b border-gray-100 px-4 py-3">
      <div className="max-w-3xl mx-auto flex justify-between items-center">
        <Link href="/" className="font-bold text-gray-900">Bolagsvy</Link>
        <div className="flex gap-4 text-sm">
          {user ? (
            <>
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</Link>
              <Link href="/konto" className="text-gray-600 hover:text-gray-900">Konto</Link>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-gray-600 hover:text-gray-900">Logga in</Link>
              <Link href="/auth/registrera" className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                Pro — 299 kr/mån
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
