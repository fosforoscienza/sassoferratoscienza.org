# Sassoferrato Scienza

Sito ufficiale di **Fosforo · la festa della scienza** a Sassoferrato — venerdì **24 luglio 2026**,
Piazza Bartolo e Corso Cavour. Landing one-page + **sistema di prenotazione** dei laboratori
(email con QR code, check-in via scan), sullo stile di
[viceversa.unicam.it](https://viceversa.unicam.it).

## Stack

- **Next.js 14** (App Router)
- **Supabase** (Postgres + Auth + RLS) — riusa il progetto **Fosforo** esistente, con tutte le
  tabelle/funzioni prefissate `sass_` per non collidere.
- **Resend** — email transazionale con QR allegato
- **Tailwind CSS** + font Hanken Grotesk / Space Mono
- **jsQR** — scansione QR lato webcam (check-in)

## Cosa contiene

| Area | Percorso |
|---|---|
| Landing (home) | `/` — la grafica del pieghevole, in `app/landing-html.ts` + `app/landing.css` |
| Lista laboratori | `/prenota` |
| Form di prenotazione | `/prenota/[id]` (con selezione turno per i lab a turni) |
| Conferma + QR + cancellazione | `/conferma/[token]` |
| Login staff | `/login` |
| Admin — prenotazioni + export CSV | `/admin/prenotazioni` |
| Admin — scan QR / check-in | `/admin/scan` |
| API | `/api/prenota`, `/api/prenota/[token]` (DELETE), `/api/checkin`, … |

I **5 laboratori** sono `sass_eventi`. Quelli con più orari (astrolabio, VR, illusione) usano i
**turni** (`sass_turni`); gli altri due restano a capienza unica. Capienze e orari sono nel seed di
`supabase/schema_sassoferrato.sql` e si modificano liberamente (anche da Supabase Studio).

## Setup

### 1. Schema sul progetto Supabase di Fosforo

Nel **SQL Editor** del progetto Supabase di Fosforo, esegui una sola volta
`supabase/schema_sassoferrato.sql`. Crea tabelle/viste/funzioni `sass_*` e fa il seed dei 5
laboratori con i relativi turni. **Non collide** con gli oggetti esistenti di Fosforo.

### 2. Variabili d'ambiente

```bash
cp .env.local.example .env.local
```

Compila con le chiavi reali:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — dal
  progetto Supabase di Fosforo.
- `RESEND_API_KEY` + `RESEND_FROM` — dominio verificato su Resend (es.
  `noreply@sassoferratoscienza.org`). Senza queste, l'app funziona ma **non invia email**.
- `NEXT_PUBLIC_SITE_URL` — l'URL pubblico (usato nei QR e nei link delle email).
- `UPSTASH_*` — opzionali (rate limit; senza, degradazione graceful).

### 3. Avvio locale

```bash
npm install
npm run dev   # http://localhost:3000
```

### 4. Primo amministratore

Nel SQL Editor di Supabase:

```sql
INSERT INTO public.sass_admin_users (email, ruolo)
VALUES ('tua@email.com', 'super_admin');
```

Crea poi l'utente con quella email in **Supabase → Authentication → Users** (o registralo) e accedi
da `/login`.

## Deploy

- **Vercel**: collega il repo, aggiungi le variabili d'ambiente, deploy.
- In Resend verifica il dominio mittente; imposta `RESEND_FROM` di conseguenza.

## Modificare la landing

Il markup della home vive in `app/landing-html.ts` (stili in `app/landing.css`). È stato generato
dal prototipo `design_handoff_sassoferrato_scienza/`. Per modifiche sostanziali alla grafica si può
intervenire direttamente su questi due file.

## Note

- Le prenotazioni pubbliche passano **solo** da `/api/prenota` (validazione Zod, capienza, max 5
  posti per email, rate-limit): l'insert diretto via anon key è bloccato dalle RLS.
- Lo scan accetta solo i QR del laboratorio/turno selezionato e tiene il conteggio dei check-in in
  tempo reale.
