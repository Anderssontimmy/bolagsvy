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

-- ---------------------------------------------------------------------------
-- Fas 2: anmälan till hyresvärden ("anmälan med ett klick").
-- Innehållet ändras aldrig efter att det har skapats – det är beviset.
-- ---------------------------------------------------------------------------

create table if not exists public.anmalan (
  id uuid primary key,
  -- SHA-256 av koden i bekräftelselänken. Själva koden sparas aldrig.
  token_hash text not null unique,
  giltig_till timestamptz not null,
  status text not null default 'vantar' check (status in ('vantar', 'skickad')),
  hyresgast_namn text not null,
  hyresgast_epost text not null,
  hyresvard_namn text not null,
  hyresvard_epost text not null,
  amne text not null,
  innehall text not null,
  -- SHA-256 av ämne + text. Visar att innehållet inte har ändrats.
  innehall_sha256 text not null,
  skapad timestamptz not null default now(),
  skickad timestamptz,
  leverantor_id text
);

alter table public.anmalan enable row level security;

-- Stoppa ändringar av innehållet. Bara status, skickad och leverantor_id får uppdateras.
create or replace function public.anmalan_las_innehall() returns trigger
language plpgsql as $$
begin
  if new.amne is distinct from old.amne
     or new.innehall is distinct from old.innehall
     or new.innehall_sha256 is distinct from old.innehall_sha256
     or new.hyresgast_epost is distinct from old.hyresgast_epost
     or new.hyresvard_epost is distinct from old.hyresvard_epost then
    raise exception 'Innehållet i en anmälan får inte ändras';
  end if;
  return new;
end $$;

drop trigger if exists anmalan_las_innehall on public.anmalan;
create trigger anmalan_las_innehall before update on public.anmalan
  for each row execute function public.anmalan_las_innehall();
