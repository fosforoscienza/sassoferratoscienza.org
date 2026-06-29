import { Resend } from 'resend'
import { generaQrBuffer, confermaUrl } from './qr'
import { formatRangeOrario, formatDataIT } from './types'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const FROM = process.env.RESEND_FROM ?? 'Sassoferrato Scienza <noreply@fosforoscienza.it>'
const REPLY_TO = process.env.RESEND_REPLY_TO ?? 'info@fosforoscienza.it'

type EmailPrenotazioneArgs = {
  to: string
  nome: string
  cognome: string
  token: string
  evento: {
    titolo: string
    sottotitolo: string | null
    categoria: string | null
    data: string
    ora_inizio: string
    ora_fine: string | null
    luogo: string | null
  }
  n_persone: number
}

export async function inviaEmailPrenotazione(args: EmailPrenotazioneArgs): Promise<boolean> {
  if (!resend) {
    console.warn('[email] RESEND_API_KEY non configurata — email non inviata')
    return false
  }

  const orario = formatRangeOrario(args.evento.ora_inizio, args.evento.ora_fine)
  const data = formatDataIT(args.evento.data)
  const link = confermaUrl(args.token)
  const cancelLink = `${link}?cancel=1`
  const luogo = args.evento.luogo || 'Piazza Bartolo · Corso Cavour'

  const qrPng = await generaQrBuffer(args.token)
  const qrBase64 = qrPng.toString('base64')

  const html = `
    <!doctype html>
    <html lang="it">
      <body style="margin:0;padding:0;background:#ece2d0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1d1b16">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ece2d0;padding:32px 16px">
          <tr><td align="center">
            <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fbf7ef;border-radius:18px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08)">
              <tr><td style="background:linear-gradient(135deg,#0f9bd8,#16b39a);padding:28px 32px 24px;text-align:center;color:#fff">
                <p style="margin:0 0 4px;font-size:12px;letter-spacing:.22em;text-transform:uppercase;color:#f3ece0">Fosforo · la festa della scienza</p>
                <h1 style="margin:0;font-size:22px;font-weight:800">Sassoferrato Scienza</h1>
                <p style="margin:6px 0 0;font-size:13px;opacity:.92">Venerdì 24 luglio 2026 · Sassoferrato (AN)</p>
              </td></tr>

              <tr><td style="padding:28px 32px 8px">
                <p style="margin:0 0 6px;font-size:16px">Ciao <strong>${args.nome} ${args.cognome}</strong>,</p>
                <p style="margin:0;font-size:15px;line-height:1.5">la tua prenotazione è confermata. Mostra il <strong>QR code</strong> qui sotto all'ingresso del laboratorio.</p>
              </td></tr>

              <tr><td style="padding:18px 32px 8px;text-align:center">
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;background:#ffffff;border:4px solid #efe6d6;border-radius:18px;padding:14px">
                  <tr><td style="text-align:center">
                    <img src="cid:sass-qr"
                         alt="QR code prenotazione"
                         width="240" height="240"
                         style="display:block;width:240px;height:240px;border-radius:8px"/>
                  </td></tr>
                </table>
                <p style="margin:10px 0 0;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#9a8f7e">Codice di accesso</p>
              </td></tr>

              <tr><td style="padding:12px 32px 4px">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid rgba(0,0,0,.07);border-radius:14px;padding:18px">
                  <tr><td>
                    ${args.evento.categoria ? `<p style="margin:0 0 4px;font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:#0a6e9c">${args.evento.categoria}</p>` : ''}
                    <h2 style="margin:0 0 4px;font-size:18px;color:#1d1b16">${args.evento.titolo}</h2>
                    ${args.evento.sottotitolo ? `<p style="margin:0 0 10px;font-size:13px;color:#5c5448">${args.evento.sottotitolo}</p>` : ''}
                    <p style="margin:8px 0 0;font-size:14px;color:#334155">📅 <strong>${data}</strong> · 🕐 <strong>${orario}</strong></p>
                    <p style="margin:6px 0 0;font-size:14px;color:#334155">📍 ${luogo} · Sassoferrato (AN)</p>
                    <p style="margin:6px 0 0;font-size:14px;color:#334155">👥 ${args.n_persone} ${args.n_persone === 1 ? 'persona' : 'persone'}</p>
                  </td></tr>
                </table>
              </td></tr>

              <tr><td style="padding:18px 32px 8px;text-align:center">
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto">
                  <tr>
                    <td style="padding:0 6px">
                      <a href="${link}" style="display:inline-block;background:#0f9bd8;color:#fff;text-decoration:none;font-weight:700;padding:11px 22px;border-radius:999px;font-size:14px">Vedi la prenotazione</a>
                    </td>
                    <td style="padding:0 6px">
                      <a href="${cancelLink}" style="display:inline-block;background:#ffffff;color:#dc2626;border:1px solid #fecaca;text-decoration:none;font-weight:600;padding:10px 22px;border-radius:999px;font-size:14px">Cancella</a>
                    </td>
                  </tr>
                </table>
              </td></tr>

              <tr><td style="padding:8px 32px 28px">
                <p style="margin:0;font-size:12px;color:#9a8f7e;line-height:1.5;text-align:center">
                  Trovi il QR anche in allegato. Per informazioni:
                  <a href="mailto:${REPLY_TO}" style="color:#0a6e9c;text-decoration:underline">${REPLY_TO}</a>
                </p>
              </td></tr>

              <tr><td style="background:#efe6d6;padding:18px 32px;text-align:center;border-top:1px solid rgba(0,0,0,.08)">
                <p style="margin:0;font-size:12px;color:#5c5448">Sassoferrato Scienza · Fosforo — la festa della scienza · Ingresso libero</p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body>
    </html>
  `

  const { error } = await resend.emails.send({
    from: FROM,
    to: args.to,
    replyTo: REPLY_TO,
    subject: `Prenotazione confermata — ${args.evento.titolo}`,
    html,
    attachments: [
      {
        filename: 'sassoferrato-qr.png',
        content: qrBase64,
        contentId: 'sass-qr',
        contentType: 'image/png',
      },
    ],
  })

  if (error) {
    console.error('[email] Errore invio Resend:', error)
    return false
  }
  return true
}
