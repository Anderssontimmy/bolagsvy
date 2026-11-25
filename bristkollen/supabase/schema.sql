-- Bristkollen fas 1: väntelistan.
-- Kör i Supabase → SQL Editor. Skapa projektet i en EU-region (t.ex. Stockholm eller Frankfurt).

create table if not exists public.vantelista (
  id bigint generated always as identity primary key,
  epost text not null unique check (char_length(epost) between 3 and 254),
  brist text check (
    brist in ('kyla', 'renovering', 'kok_badrum', 'buller', 'granne',
              'hiss', 'tvattstuga', 'mogel', 'vattenskada')
  ),
  postnummer text check (postnummer ~ '^[1-9][0-9]{4}$'),
  -- Vilken version av integritetspolicyn personen godkände.
  integritet_version text not null,
  skapad timestamptz not null default now()
);

comment on table public.vantelista is
  'Väntelista. Bara e-post (krävs), brist och postnummer (frivilliga). Ingen IP-adress sparas.';

-- Radnivåskydd utan policyer: ingen kan läsa eller skriva med den publika nyckeln.
-- Servern använder den hemliga nyckeln (SUPABASE_SECRET_KEY), som går förbi RLS.
alter table public.vantelista enable row level security;

-- Radera en person på begäran (GDPR):
--   delete from public.vantelista where epost = 'namn@exempel.se';
