-- ============================================================
-- SASSOFERRATO SCIENZA — Schema Supabase
--
-- Pensato per essere eseguito SUL PROGETTO SUPABASE DI FOSFORO già esistente:
-- tutte le tabelle/funzioni/viste sono prefissate `sass_` per non collidere
-- con gli oggetti di Fosforo. Eseguire una sola volta nel SQL Editor.
-- ============================================================

-- ============================================================
-- ADMIN USERS (whitelist email)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sass_admin_users (
  email      TEXT PRIMARY KEY,
  ruolo      TEXT NOT NULL DEFAULT 'admin' CHECK (ruolo IN ('admin', 'super_admin', 'scanner')),
  nome       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.sass_admin_users ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin_sass()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.sass_admin_users a
    JOIN auth.users u ON LOWER(u.email) = LOWER(a.email)
    WHERE u.id = auth.uid()
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin_sass() FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin_sass() TO authenticated, service_role;

DROP POLICY IF EXISTS "sass_admin_users_admin_all" ON public.sass_admin_users;
CREATE POLICY "sass_admin_users_admin_all" ON public.sass_admin_users
  FOR ALL USING (public.is_admin_sass()) WITH CHECK (public.is_admin_sass());

-- ============================================================
-- EVENTI (laboratori)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sass_eventi (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero               SMALLINT NOT NULL UNIQUE,
  categoria            TEXT NOT NULL,
  colore               TEXT NOT NULL DEFAULT '#0f9bd8',
  data                 DATE NOT NULL,
  ora_inizio           TIME NOT NULL,
  ora_fine             TIME,
  titolo               TEXT NOT NULL,
  sottotitolo          TEXT,
  descrizione          TEXT,
  eta                  TEXT,
  luogo                TEXT,
  capienza_max         INTEGER,
  prenotazioni_attive  BOOLEAN NOT NULL DEFAULT TRUE,
  posti_esauriti       BOOLEAN NOT NULL DEFAULT FALSE,
  a_turni              BOOLEAN NOT NULL DEFAULT FALSE,
  durata_turno_min     SMALLINT CHECK (durata_turno_min IS NULL OR (durata_turno_min BETWEEN 5 AND 720)),
  capienza_turno       SMALLINT CHECK (capienza_turno IS NULL OR (capienza_turno BETWEEN 1 AND 10000)),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sass_eventi_numero_idx ON public.sass_eventi (numero);

ALTER TABLE public.sass_eventi ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sass_eventi_public_read" ON public.sass_eventi;
CREATE POLICY "sass_eventi_public_read" ON public.sass_eventi
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "sass_eventi_admin_all" ON public.sass_eventi;
CREATE POLICY "sass_eventi_admin_all" ON public.sass_eventi
  FOR ALL USING (public.is_admin_sass()) WITH CHECK (public.is_admin_sass());

-- ============================================================
-- TURNI (slot prenotabili per eventi con a_turni = TRUE)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sass_turni (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id  UUID NOT NULL REFERENCES public.sass_eventi(id) ON DELETE CASCADE,
  data       DATE NOT NULL,
  ora_inizio TIME NOT NULL,
  ora_fine   TIME NOT NULL CHECK (ora_fine > ora_inizio),
  capienza   SMALLINT NOT NULL CHECK (capienza BETWEEN 1 AND 10000),
  ordine     SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (evento_id, data, ora_inizio)
);

CREATE INDEX IF NOT EXISTS sass_turni_evento_idx
  ON public.sass_turni (evento_id, data, ora_inizio);

ALTER TABLE public.sass_turni ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sass_turni_public_read" ON public.sass_turni;
CREATE POLICY "sass_turni_public_read" ON public.sass_turni
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "sass_turni_admin_all" ON public.sass_turni;
CREATE POLICY "sass_turni_admin_all" ON public.sass_turni
  FOR ALL USING (public.is_admin_sass()) WITH CHECK (public.is_admin_sass());

-- ============================================================
-- PRENOTAZIONI
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sass_prenotazioni (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id    UUID NOT NULL REFERENCES public.sass_eventi(id) ON DELETE CASCADE,
  turno_id     UUID REFERENCES public.sass_turni(id) ON DELETE CASCADE,
  nome         TEXT NOT NULL,
  cognome      TEXT NOT NULL,
  email        TEXT NOT NULL,
  telefono     TEXT,
  cap          TEXT CHECK (cap IS NULL OR cap ~ '^[0-9]{5}$'),
  n_persone    SMALLINT NOT NULL DEFAULT 1 CHECK (n_persone BETWEEN 1 AND 20),
  note         TEXT,
  token        UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  check_in_at  TIMESTAMPTZ,
  check_in_by  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sass_prenotazioni_evento_idx ON public.sass_prenotazioni (evento_id);
CREATE INDEX IF NOT EXISTS sass_prenotazioni_turno_idx ON public.sass_prenotazioni (turno_id);
CREATE INDEX IF NOT EXISTS sass_prenotazioni_email_idx ON public.sass_prenotazioni (LOWER(email));

ALTER TABLE public.sass_prenotazioni ENABLE ROW LEVEL SECURITY;

-- Solo admin: l'API /api/prenota usa service_role per insert+select. Bloccare
-- l'insert pubblico previene il bypass diretto a /rest/v1 con la sola anon key
-- (che salterebbe validazioni Zod, rate-limit, CAP, privacy, limite 5/email).
DROP POLICY IF EXISTS "sass_prenotazioni_admin_all" ON public.sass_prenotazioni;
CREATE POLICY "sass_prenotazioni_admin_all" ON public.sass_prenotazioni
  FOR ALL USING (public.is_admin_sass()) WITH CHECK (public.is_admin_sass());

-- ============================================================
-- TRIGGER updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.sass_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sass_eventi_updated_at ON public.sass_eventi;
CREATE TRIGGER sass_eventi_updated_at
  BEFORE UPDATE ON public.sass_eventi
  FOR EACH ROW EXECUTE PROCEDURE public.sass_set_updated_at();

-- ============================================================
-- VISTA: posti residui per turno
-- ============================================================
CREATE OR REPLACE VIEW public.sass_turni_disponibilita
WITH (security_invoker = on) AS
SELECT
  t.id,
  t.evento_id,
  t.data,
  t.ora_inizio,
  t.ora_fine,
  t.capienza,
  t.ordine,
  COALESCE(SUM(p.n_persone), 0)::int AS posti_prenotati,
  GREATEST(t.capienza - COALESCE(SUM(p.n_persone), 0)::int, 0) AS posti_residui
FROM public.sass_turni t
LEFT JOIN public.sass_prenotazioni p ON p.turno_id = t.id
GROUP BY t.id;

-- ============================================================
-- VISTA: posti residui per evento (non a turni)
-- ============================================================
CREATE OR REPLACE VIEW public.sass_eventi_disponibilita
WITH (security_invoker = on) AS
SELECT
  e.id,
  e.titolo,
  e.capienza_max,
  COALESCE(SUM(p.n_persone), 0)::int AS posti_prenotati,
  CASE
    WHEN e.capienza_max IS NULL THEN NULL
    ELSE GREATEST(e.capienza_max - COALESCE(SUM(p.n_persone), 0)::int, 0)
  END AS posti_residui
FROM public.sass_eventi e
LEFT JOIN public.sass_prenotazioni p ON p.evento_id = e.id AND p.turno_id IS NULL
GROUP BY e.id;

-- ============================================================
-- RPC: scan_targets (pagina admin/scan)
-- ============================================================
CREATE OR REPLACE FUNCTION public.sass_scan_targets()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  result jsonb;
begin
  if not (coalesce(public.is_admin_sass(), false)
          or coalesce(auth.role(), '') = 'service_role') then
    raise exception 'not authorized';
  end if;

  with
  turni_stats as (
    select
      t.evento_id,
      t.id as turno_id,
      t.data as turno_data,
      t.ora_inizio,
      t.ora_fine,
      t.capienza,
      coalesce(sum(p.n_persone), 0)::int as prenotati_persone,
      coalesce(sum(p.n_persone) filter (where p.check_in_at is not null), 0)::int as checkin_persone
    from sass_turni t
    left join sass_prenotazioni p on p.turno_id = t.id
    group by t.evento_id, t.id, t.data, t.ora_inizio, t.ora_fine, t.capienza
  ),
  turni_per_evento as (
    select
      evento_id,
      jsonb_agg(
        jsonb_build_object(
          'turno_id', turno_id,
          'data', to_char(turno_data, 'YYYY-MM-DD'),
          'ora_inizio', to_char(ora_inizio, 'HH24:MI'),
          'ora_fine', to_char(ora_fine, 'HH24:MI'),
          'capienza', capienza,
          'prenotati_persone', prenotati_persone,
          'checkin_persone', checkin_persone
        )
        order by turno_data, ora_inizio
      ) as turni,
      coalesce(sum(prenotati_persone), 0)::int as prenotati_persone,
      coalesce(sum(checkin_persone), 0)::int as checkin_persone
    from turni_stats
    group by evento_id
  ),
  evento_stats as (
    select
      p.evento_id,
      coalesce(sum(p.n_persone), 0)::int as prenotati_persone,
      coalesce(sum(p.n_persone) filter (where p.check_in_at is not null), 0)::int as checkin_persone
    from sass_prenotazioni p
    where p.turno_id is null
    group by p.evento_id
  ),
  eventi_json as (
    select
      jsonb_build_object(
        'evento_id', e.id,
        'titolo', e.titolo,
        'data', to_char(e.data, 'YYYY-MM-DD'),
        'ora_inizio', to_char(e.ora_inizio, 'HH24:MI'),
        'ora_fine', to_char(e.ora_fine, 'HH24:MI'),
        'a_turni', e.a_turni,
        'capienza', e.capienza_max,
        'prenotati_persone', case when e.a_turni then coalesce(tpe.prenotati_persone, 0) else coalesce(es.prenotati_persone, 0) end,
        'checkin_persone', case when e.a_turni then coalesce(tpe.checkin_persone, 0) else coalesce(es.checkin_persone, 0) end,
        'turni', case when e.a_turni then coalesce(tpe.turni, '[]'::jsonb) else '[]'::jsonb end
      ) as ev,
      e.numero as e_numero
    from sass_eventi e
    left join turni_per_evento tpe on tpe.evento_id = e.id
    left join evento_stats es on es.evento_id = e.id
  )
  select jsonb_build_array(
    jsonb_build_object(
      'palco_id', 'laboratori',
      'palco_nome', 'Laboratori',
      'eventi', coalesce(jsonb_agg(ev order by e_numero), '[]'::jsonb)
    )
  ) into result
  from eventi_json;

  return coalesce(result, '[]'::jsonb);
end;
$function$;

REVOKE EXECUTE ON FUNCTION public.sass_scan_targets() FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.sass_scan_targets() TO authenticated, service_role;

-- ============================================================
-- SEED: i 5 laboratori (24 luglio 2026)
-- Capienze indicative: modificabili a piacere.
-- ============================================================
INSERT INTO public.sass_eventi
  (numero, categoria, colore, data, ora_inizio, ora_fine, titolo, sottotitolo, eta, luogo, capienza_max, a_turni, durata_turno_min, capienza_turno, descrizione)
VALUES
  (1, 'Tinkering', '#3db3e4', '2026-07-24', '17:30', '22:00',
   'Discesa libera', 'Si freni chi può', '8+', 'Piazza Bartolo', NULL, TRUE, 45, 5,
   'Usa materiali di uso quotidiano per costruire "qualcosa" da far scivolare su una rampa di legno. L''obiettivo? Arrivare per ultimi al traguardo! Riuscirai a sfruttare la fisica per rallentare?'),
  (2, 'Matematica', '#46b25e', '2026-07-24', '17:30', '22:00',
   'Labirinti matematici', 'Riuscirai a trovare l''uscita?', '6+', 'Corso Cavour', NULL, TRUE, 45, 5,
   'Preparati a perderti… nella matematica! Tra curve, incroci e scelte da fare, i labirinti matematici giganti mettono alla prova logica, calcoli e strategia. Un gioco a grandezza naturale dove ogni passo è un''operazione.'),
  (3, 'Astronomia', '#6a5cc7', '2026-07-24', '17:30', '21:45',
   'Costruiamo l''astrolabio', 'Il fascino del cielo visto da vicino', '8+', 'Piazza Bartolo', NULL, TRUE, 45, 20,
   'Portati a casa una notte stellata. Esploriamo le maggiori costellazioni del nostro cielo e i miti che le animano. Costruiamo insieme un astrolabio per orientarci nella volta celeste.'),
  (4, 'Natura · VR', '#16b39a', '2026-07-24', '17:30', '21:45',
   'La natura a 360°', 'Le aree naturalistiche delle Marche nei visori VR', '8+', 'Corso Cavour', NULL, TRUE, 45, 7,
   'All''interno del progetto "Tra borghi e natura", grazie ai visori di realtà virtuale immersivi a 360°, vivrai un video emozionale girato nei luoghi naturalistici più affascinanti delle Marche.'),
  (5, 'Percezione', '#e85aa0', '2026-07-24', '17:30', '21:45',
   'Occhio all''illusione', 'Lasciamoci ingannare', '8+', 'Piazza Bartolo', NULL, TRUE, 45, 20,
   'Scopriamo come funzionano occhi e cervello! Tra giochi, esperimenti e illusioni ottiche, seguiamo il viaggio della luce che entra nei nostri occhi e diventa le immagini che vediamo ogni giorno.')
ON CONFLICT (numero) DO NOTHING;

-- Turni per i laboratori a turni (astrolabio, VR, illusione)
INSERT INTO public.sass_turni (evento_id, data, ora_inizio, ora_fine, capienza, ordine)
SELECT e.id, '2026-07-24', s.ora_inizio::time, s.ora_fine::time, e.capienza_turno, s.ordine
FROM public.sass_eventi e
JOIN (VALUES
  (1, '17:30', '18:15', 0),
  (1, '18:30', '19:15', 1),
  (1, '19:30', '20:15', 2),
  (1, '21:00', '21:45', 3),
  (2, '17:30', '18:15', 0),
  (2, '18:30', '19:15', 1),
  (2, '19:30', '20:15', 2),
  (2, '21:00', '21:45', 3),
  (3, '17:30', '18:15', 0),
  (3, '21:00', '21:45', 1),
  (4, '17:30', '18:15', 0),
  (4, '21:00', '21:45', 1),
  (5, '17:30', '18:15', 0),
  (5, '18:30', '19:15', 1),
  (5, '19:30', '20:15', 2),
  (5, '21:00', '21:45', 3)
) AS s(numero, ora_inizio, ora_fine, ordine) ON s.numero = e.numero
ON CONFLICT (evento_id, data, ora_inizio) DO NOTHING;

-- ============================================================
-- Per promuovere il primo admin (eseguire manualmente):
-- INSERT INTO public.sass_admin_users (email, ruolo) VALUES ('tua@email.com', 'super_admin');
-- ============================================================
