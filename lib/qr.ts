import QRCode from 'qrcode'

/**
 * URL pubblico usato sia per la conferma utente (link nell'email)
 * che come payload del QR (lo scanner admin legge il token).
 */
export function confermaUrl(token: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  return `${base}/conferma/${token}`
}

export function qrPayload(token: string): string {
  return confermaUrl(token)
}

/** PNG buffer (per allegati email). */
export async function generaQrBuffer(token: string): Promise<Buffer> {
  return QRCode.toBuffer(qrPayload(token), {
    type: 'png',
    margin: 1,
    width: 512,
    color: { dark: '#0a6e9c', light: '#ffffff' },
  })
}

/** Data URI (per <img src> client-side). */
export async function generaQrDataUrl(token: string): Promise<string> {
  return QRCode.toDataURL(qrPayload(token), {
    margin: 1,
    width: 512,
    color: { dark: '#0a6e9c', light: '#ffffff' },
  })
}
