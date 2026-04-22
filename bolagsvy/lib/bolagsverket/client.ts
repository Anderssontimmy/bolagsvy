const BASE_URL = 'https://api.bolagsverket.se/foretagsinformation/v1'

export interface BolagsverketCompany {
  organisationsnummer: string
  foretagsnamn: string
  status: string
  adress?: {
    gatuadress?: string
    postort?: string
    lan?: string
  }
  sniKod?: string
  sniBeskriving?: string
  registreringsdatum?: string
  styrelseledamoter?: Array<{ namn: string; roll: string }>
}

export async function searchCompanies(query: string): Promise<BolagsverketCompany[]> {
  const res = await fetch(`${BASE_URL}/sok?q=${encodeURIComponent(query)}&limit=20`, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 3600 },
  })
  if (!res.ok) throw new Error(`Bolagsverket search failed: ${res.status}`)
  const data = await res.json()
  return data.resultat ?? []
}

export async function getCompany(orgNumber: string): Promise<BolagsverketCompany | null> {
  const clean = orgNumber.replace(/-/g, '')
  const res = await fetch(`${BASE_URL}/foretag/${clean}`, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 3600 },
  })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Bolagsverket fetch failed: ${res.status}`)
  return res.json()
}
