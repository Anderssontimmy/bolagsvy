/**
 * Bulk seed from Bolagsverket open data.
 *
 * Step 1: Downloads the free bulk file (all ~600k org numbers + basic data).
 * Step 2: Enriches each company via the "Värdefulla datamängder" API.
 * Step 3: Upserts into Supabase in batches of 50.
 *
 * Find the bulk file URL at:
 *   bolagsverket.se/apierochoppnadata/hamtaforetagsinformation/nedladdningsbarafiler.2517.html
 * Set BOLAGSVERKET_BULK_URL in .env.local to that direct download link.
 *
 * Usage:
 *   npx tsx scripts/seed-bulk.ts
 *   npx tsx scripts/seed-bulk.ts --limit 1000   (test run)
 */

import { createClient } from '@supabase/supabase-js'
import { getCompany } from '../lib/bolagsverket/client'
import { toSlug } from '../lib/utils/slug'
import { createGunzip } from 'zlib'
import { createInterface } from 'readline'
import { Readable } from 'stream'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BULK_URL  = process.env.BOLAGSVERKET_BULK_URL!
const BATCH     = 50
const DELAY_MS  = 1100  // 60 req/min = 1 req/sec + buffer
const limitArg  = process.argv.find(a => a.startsWith('--limit='))
const LIMIT     = limitArg ? parseInt(limitArg.split('=')[1]) : Infinity

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

// Parse the Bolagsverket bulk text file (pipe-delimited, one org per line).
// Actual column order confirmed from the file header row.
function parseOrgNumber(line: string): string | null {
  if (!line || line.startsWith('#') || line.startsWith('Organisationsnummer')) return null
  const cols = line.split('|')
  const orgnr = cols[0]?.trim().replace(/-/g, '')
  if (!orgnr || orgnr.length !== 10) return null
  return orgnr
}

async function streamOrgNumbers(url: string): Promise<string[]> {
  console.log('Downloading bulk file from Bolagsverket…')
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Bulk download failed: ${res.status}`)

  const contentType = res.headers.get('content-type') ?? ''
  const isZip = url.endsWith('.zip') || contentType.includes('zip')

  if (isZip) {
    // For zip files, we'd need a zip parser. Simpler: Bolagsverket also offers
    // a plain .txt download. Check the bulk download page for the .txt link.
    throw new Error('ZIP format not supported yet — use the plain .txt download URL in BOLAGSVERKET_BULK_URL')
  }

  const text = await res.text()
  const lines = text.split('\n')
  const orgnrs: string[] = []

  for (const line of lines) {
    const orgnr = parseOrgNumber(line)
    if (orgnr) orgnrs.push(orgnr)
  }

  console.log(`Found ${orgnrs.length} org numbers in bulk file`)
  return orgnrs
}

async function upsertBatch(companies: Parameters<typeof supabase.from>[0] extends never ? never : any[]) {
  const { error } = await supabase.from('companies').upsert(companies, { onConflict: 'org_number' })
  if (error) console.error('Upsert error:', error.message)
}

async function seed() {
  if (!BULK_URL) {
    throw new Error(
      'BOLAGSVERKET_BULK_URL not set.\n' +
      'Find the download link at:\n' +
      'bolagsverket.se/apierochoppnadata/hamtaforetagsinformation/nedladdningsbarafiler.2517.html\n' +
      'Then add it to .env.local'
    )
  }

  const allOrgnrs = await streamOrgNumbers(BULK_URL)
  const orgnrs = allOrgnrs.slice(0, LIMIT)
  console.log(`Processing ${orgnrs.length} companies…`)

  let batch: object[] = []
  let ok = 0
  let skip = 0

  for (let i = 0; i < orgnrs.length; i++) {
    const orgnr = orgnrs[i]

    try {
      const company = await getCompany(orgnr)
      if (!company) { skip++; continue }

      const slug = toSlug(company.foretagsnamn, orgnr)
      batch.push({
        org_number:      orgnr,
        name:            company.foretagsnamn,
        status:          company.status,
        address:         company.adress?.gatuadress ?? null,
        city:            company.adress?.postort ?? null,
        sni_code:        company.sniKod ?? null,
        sni_description: company.sniBeskriving ?? null,
        registered_at:   company.registreringsdatum ?? null,
        board_members:   company.styrelseledamoter ?? [],
        slug,
      })
      ok++
    } catch (err: any) {
      console.warn(`Skip ${orgnr}: ${err.message}`)
      skip++
    }

    if (batch.length >= BATCH) {
      await upsertBatch(batch)
      batch = []
      console.log(`Progress: ${i + 1}/${orgnrs.length} (${ok} ok, ${skip} skipped)`)
    }

    await sleep(DELAY_MS)
  }

  if (batch.length > 0) await upsertBatch(batch)
  console.log(`Done. ${ok} companies imported, ${skip} skipped.`)
}

seed().catch(err => { console.error(err.message); process.exit(1) })
