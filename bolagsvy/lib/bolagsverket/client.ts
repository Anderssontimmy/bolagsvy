// Endpoints confirmed from developer portal after receiving credentials.
// Token endpoint and API base URL follow WSO2 API Manager conventions.
const TOKEN_URL = 'https://gateway.api.bolagsverket.se/oauth2/token'
const API_BASE  = 'https://gateway.api.bolagsverket.se/vardefulladatamangder/v1'

// Response shapes from "Värdefulla datamängder v1" API
interface BvOrganisation {
  organisationsidentitet: { identitetsbeteckning: string }
  organisationsnamn: {
    organisationsnamnLista: Array<{ namn: string }>
  }
  organisationsform: { klartext: string; kod: string } | null
  juridiskForm: { klartext: string; kod: string } | null
  naringsgrenOrganisation: {
    sni: Array<{ klartext: string; kod: string }>
  } | null
  postadressOrganisation: {
    postadress: {
      utdelningsadress: string | null
      postort: string | null
      postnummer: string | null
    }
  } | null
  organisationsdatum: { registreringsdatum: string | null } | null
  verksamOrganisation: { kod: string } | null
  avregistreradOrganisation: unknown | null
  verksamhetsbeskrivning: { beskrivning: string | null } | null
}

export interface BolagsverketCompany {
  organisationsnummer: string
  foretagsnamn: string
  status: string
  adress?: { gatuadress?: string; postort?: string; lan?: string }
  sniKod?: string
  sniBeskriving?: string
  registreringsdatum?: string
  styrelseledamoter?: Array<{ namn: string; roll: string }>
}

// Simple in-memory token cache
let cachedToken: string | null = null
let tokenExpiry = 0

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken

  const clientId     = process.env.BOLAGSVERKET_CLIENT_ID!
  const clientSecret = process.env.BOLAGSVERKET_CLIENT_SECRET!

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'client_credentials',
      client_id:     clientId,
      client_secret: clientSecret,
    }),
  })

  if (!res.ok) throw new Error(`Bolagsverket token failed: ${res.status}`)

  const data = await res.json()
  cachedToken = data.access_token
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000
  return cachedToken!
}

function parseOrganisation(org: BvOrganisation): BolagsverketCompany {
  const orgnr  = org.organisationsidentitet.identitetsbeteckning
  const namn   = org.organisationsnamn?.organisationsnamnLista?.[0]?.namn ?? orgnr
  const active = !org.avregistreradOrganisation && org.verksamOrganisation?.kod === 'JA'
  const sni    = org.naringsgrenOrganisation?.sni?.find(s => s.kod?.trim())

  return {
    organisationsnummer: orgnr,
    foretagsnamn:        namn,
    status:              active ? 'active' : 'inactive',
    adress: {
      gatuadress: org.postadressOrganisation?.postadress?.utdelningsadress ?? undefined,
      postort:    org.postadressOrganisation?.postadress?.postort ?? undefined,
    },
    sniKod:            sni?.kod?.trim() ?? undefined,
    sniBeskriving:     sni?.klartext?.trim() ?? undefined,
    registreringsdatum: org.organisationsdatum?.registreringsdatum ?? undefined,
    styrelseledamoter:  [],
  }
}

export async function getCompany(orgNumber: string): Promise<BolagsverketCompany | null> {
  const clean = orgNumber.replace(/-/g, '')
  const token = await getAccessToken()

  const res = await fetch(`${API_BASE}/organisationer/${clean}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    next: { revalidate: 3600 },
  })

  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Bolagsverket fetch failed: ${res.status}`)

  const data = await res.json()
  const org: BvOrganisation = data.organisationer?.[0]
  if (!org) return null
  return parseOrganisation(org)
}

export async function searchCompanies(query: string): Promise<BolagsverketCompany[]> {
  const token = await getAccessToken()

  const res = await fetch(
    `${API_BASE}/organisationer?namn=${encodeURIComponent(query)}&limit=20`,
    {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      next: { revalidate: 3600 },
    }
  )

  if (!res.ok) throw new Error(`Bolagsverket search failed: ${res.status}`)

  const data = await res.json()
  const orgs: BvOrganisation[] = data.organisationer ?? []
  return orgs.map(parseOrganisation)
}
