import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function KontoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  async function logout() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/')
  }

  return (
    <main className="max-w-md mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Konto</h1>
      <div className="bg-gray-50 rounded-xl p-5 mb-4">
        <p className="text-sm text-gray-500">Inloggad som</p>
        <p className="font-medium text-gray-900">{user.email}</p>
      </div>
      <form action={logout}>
        <button type="submit" className="w-full py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
          Logga ut
        </button>
      </form>
    </main>
  )
}
