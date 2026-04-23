/**
 * SCB Företagsregister API client.
 *
 * Access requires a certificate from SCB — email scbforetag@scb.se with:
 *   - Organisationsnamn + org.nummer
 *   - Kontaktperson (namn, mejl)
 *   - Certifikatmottagare (namn, mejl, telefon)
 *   - Önskade datalayouter: "Je" (företagsdata med anställda)
 *
 * Set in .env.local once you receive the certificate:
 *   SCB_API_CERT_BASE64=<base64-encoded PEM cert>
 *   SCB_API_KEY=<password/key from SCB>
 *
 * Employee size classes (storleksklass antal anställda):
 *   0 = 0 anställda
 *   1 = 1–4
 *   2 = 5–9
 *   3 = 10–19
 *   4 = 20–49
 *   5 = 50–99
 *   6 = 100–199
 *   7 = 200–499
 *   8 = 500+
 */

export const EMPLOYEES_LABELS: Record<string, string> = {
  '0': '0 anställda',
  '1': '1–4 anställda',
  '2': '5–9 anställda',
  '3': '10–19 anställda',
  '4': '20–49 anställda',
  '5': '50–99 anställda',
  '6': '100–199 anställda',
  '7': '200–499 anställda',
  '8': '500+ anställda',
}

const SCB_API_BASE = 'https://api.scb.se/foretagsregistret/v1'

export interface ScbCompany {
  orgnr: string
  antalAnstallda: string  // storleksklass 0–8
  sniKod?: string
}

function hasCredentials() {
  return !!(process.env.SCB_API_CERT_BASE64 && process.env.SCB_API_KEY)
}

export async function getScbCompany(orgnr: string): Promise<ScbCompany | null> {
  if (!hasCredentials()) return null

  // Certificate auth — Node.js https agent with client cert
  // Full implementation activates once SCB credentials are in .env.local
  const res = await fetch(`${SCB_API_BASE}/foretag/${orgnr.replace(/-/g, '')}`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${process.env.SCB_API_KEY}`,
    },
  })

  if (res.status === 404) return null
  if (!res.ok) return null

  const data = await res.json()
  return {
    orgnr,
    antalAnstallda: String(data.storleksklassAntalAnstallda ?? ''),
    sniKod: data.sniKod,
  }
}
