import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY!)

interface DigestChange {
  companyName: string
  changeType: string
  detectedAt: string
}

export async function sendDigest(to: string, changes: DigestChange[]) {
  const changeLabel: Record<string, string> = {
    board_change: 'Styrelseändring',
    address_change: 'Adressändring',
    status_change: 'Statusändring',
  }

  const html = `
    <h2 style="font-family:sans-serif">Din veckorapport från Bolagsvy</h2>
    <p style="font-family:sans-serif;color:#6b7280">Ändringar hos dina bevakade bolag den senaste veckan:</p>
    ${changes.map(c => `
      <div style="padding:12px;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:8px;font-family:sans-serif">
        <strong>${c.companyName}</strong><br>
        <span style="color:#6b7280">${changeLabel[c.changeType] ?? c.changeType} · ${new Date(c.detectedAt).toLocaleDateString('sv-SE')}</span>
      </div>
    `).join('')}
    <p style="font-family:sans-serif;color:#9ca3af;font-size:12px;margin-top:24px">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">Öppna dashboard</a> ·
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/konto">Hantera prenumeration</a>
    </p>
  `

  await resend.emails.send({
    from: 'Bolagsvy <digest@bolagsvy.se>',
    to,
    subject: `Din veckorapport — ${changes.length} ändringar`,
    html,
  })
}
