import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: companies } = await supabase
    .from('companies')
    .select('slug, last_synced_at')
    .eq('status', 'active')
    .limit(50000)

  return (companies ?? []).map(c => ({
    url: `${process.env.NEXT_PUBLIC_APP_URL}/bolag/${c.slug}`,
    lastModified: new Date(c.last_synced_at),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))
}
