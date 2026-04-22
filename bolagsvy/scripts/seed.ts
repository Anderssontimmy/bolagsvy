import { createClient } from '@supabase/supabase-js'
import { searchCompanies } from '../lib/bolagsverket/client'
import { toSlug } from '../lib/utils/slug'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const queries = ['AB', 'AB Stockholm', 'AB Göteborg', 'AB Malmö', 'Bygg', 'Tech', 'Konsult', 'Handel']

async function seed() {
  for (const q of queries) {
    const companies = await searchCompanies(q)
    for (const c of companies) {
      const slug = toSlug(c.foretagsnamn, c.organisationsnummer)
      await supabase.from('companies').upsert({
        org_number: c.organisationsnummer.replace(/-/g, ''),
        name: c.foretagsnamn,
        status: c.status,
        address: c.adress?.gatuadress ?? null,
        city: c.adress?.postort ?? null,
        county: c.adress?.lan ?? null,
        sni_code: c.sniKod ?? null,
        sni_description: c.sniBeskriving ?? null,
        registered_at: c.registreringsdatum ?? null,
        board_members: c.styrelseledamoter ?? [],
        slug,
      }, { onConflict: 'org_number' })
    }
    console.log(`Seeded query: ${q} (${companies.length} companies)`)
  }
}

seed().catch(console.error)
